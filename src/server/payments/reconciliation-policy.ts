import 'server-only';
import { z } from 'zod';
import { formatMercadoPagoAmount, normalizeMercadoPagoOrderStatus } from '@/lib/integrations/mercado-pago';
import { calculateChargeBalance } from '@/lib/finance/ledger';

const providerId = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
const reference = z.object({ id: providerId, external_reference: z.string().uuid() });
const providerOrder = reference.extend({
	user_id: z.union([z.string(), z.number().int().min(1).max(Number.MAX_SAFE_INTEGER)]),
	country_code: z.literal('BRA'),
	currency: z.literal('BRL').optional(),
	live_mode: z.boolean().optional(),
	type: z.literal('online'),
	processing_mode: z.literal('automatic'),
	total_amount: z.string(),
	total_paid_amount: z.string().optional(),
	status: providerId,
	status_detail: providerId,
	transactions: z.object({
		payments: z
			.array(
				z.object({
					id: providerId,
					amount: z.string(),
					paid_amount: z.string().optional(),
					status: providerId,
					status_detail: providerId,
					payment_method: z.object({
						id: providerId,
						type: providerId,
						installments: z.number().int().optional(),
					}),
				}),
			)
			.length(1),
		refunds: z.array(z.unknown()).optional(),
	}),
});

export function readReconciliationReference(raw: unknown, orderId: string): string | null {
	// Orders de outras aplicações da conta não pertencem ao LovelyVet.
	const parsed = reference.safeParse(raw);
	if (!parsed.success) return null;
	if (parsed.data.id !== orderId) throw new Error('Identificador remoto incompatível.');
	return parsed.data.external_reference;
}

type Attempt = {
	id: string;
	collectorId: string;
	environment: string;
	amountInCents: number;
	method: string;
	installments: number;
	status: string;
	providerOrderId: string | null;
	providerPaymentId: string | null;
	providerPaidAmountInCents?: number | null;
};
type Charge = { status: string; totalInCents: number; appointmentStatus: string; isPaid: boolean };
type Payment = {
	amountInCents: number;
	onlinePaymentAttemptId: string | null;
	operationKey: string;
	source: string;
	method: string;
};

type Plan =
	| { kind: 'ignore' }
	| { kind: 'review'; reason: string }
	| { kind: 'enrich'; providerPaidAmountInCents: number }
	| {
			kind: 'update' | 'credit';
			status: string;
			providerOrderId: string;
			providerPaymentId: string;
			providerStatus: string;
			providerStatusDetail: string;
			settlesCharge: boolean;
			providerPaidAmountInCents?: number;
	  };

const review = (reason: string): Plan => ({ kind: 'review', reason });
const terminal = ['rejected', 'cancelled', 'expired'];

// O principal da Order e da transação é validado separadamente. Somente cartão
// parcelado pode ter acréscimo pago pelo comprador; nunca creditar esse acréscimo.
function hasConfirmedPaidAmount(
	attempt: Attempt,
	amount: string,
	orderPaid: string | undefined,
	paymentPaid: string | undefined,
): boolean {
	if (attempt.method !== 'credit_card' || attempt.installments <= 1)
		return orderPaid === amount && paymentPaid === amount;
	if (!orderPaid || orderPaid !== paymentPaid || !/^(0|[1-9][0-9]{0,7})\.[0-9]{2}$/.test(orderPaid)) return false;
	const cents = Number(orderPaid.replace('.', ''));
	return Number.isSafeInteger(cents) && cents >= attempt.amountInCents && cents <= 2_147_483_647;
}

// Política pura, chamada somente depois de obter a Order via API autenticada e travar o atendimento.
export function planReconciliation(
	raw: unknown,
	orderId: string,
	attempt: Attempt,
	charge: Charge,
	payments: readonly Payment[],
): Plan {
	if (attempt.status === 'review') return { kind: 'ignore' }; // revisão humana não é desfeita automaticamente
	const parsed = providerOrder.safeParse(raw);
	if (!parsed.success) return review('invalid_remote_order');
	const order = parsed.data;
	const payment = order.transactions.payments[0]!;
	const amount = formatMercadoPagoAmount(attempt.amountInCents);
	if (
		order.id !== orderId ||
		order.external_reference !== attempt.id ||
		String(order.user_id) !== attempt.collectorId ||
		(order.live_mode !== undefined && order.live_mode !== (attempt.environment === 'production'))
	)
		return review('remote_identity_mismatch');
	if (
		(attempt.providerOrderId && attempt.providerOrderId !== order.id) ||
		(attempt.providerPaymentId && attempt.providerPaymentId !== payment.id)
	)
		return review('remote_identifiers_mismatch');
	if (order.total_amount !== amount || payment.amount !== amount) return review('remote_amount_mismatch');
	if (
		attempt.method === 'pix'
			? payment.payment_method.id !== 'pix' || payment.payment_method.type !== 'bank_transfer'
			: attempt.method !== 'credit_card' ||
				payment.payment_method.type !== 'credit_card' ||
				payment.payment_method.installments !== attempt.installments
	)
		return review('remote_method_mismatch');
	const status = normalizeMercadoPagoOrderStatus(order.status, order.status_detail);
	// A transação de cartão possui detalhes de recusa distintos dos da Order.
	// Não ampliar a classificação da Order nem liberar falhas desconhecidas.
	const paymentStatus =
		attempt.method === 'credit_card' &&
		payment.status === 'failed' &&
		[
			'rejected_by_issuer',
			'insufficient_amount',
			'bad_filled_card_data',
			'card_disabled',
			'invalid_installments',
			'required_call_for_authorize',
		].includes(payment.status_detail)
			? 'rejected'
			: normalizeMercadoPagoOrderStatus(payment.status, payment.status_detail);
	if (order.transactions.refunds?.length || status === 'review' || paymentStatus === 'review')
		return review('remote_status_review');
	const existing = payments.find((p) => p.onlinePaymentAttemptId === attempt.id);
	if (existing) {
		if (
			existing.amountInCents !== attempt.amountInCents ||
			existing.method !== attempt.method ||
			existing.source !== 'mercado_pago' ||
			existing.operationKey !== attempt.id ||
			attempt.status !== 'approved'
		)
			return review('ledger_identity_mismatch');
		if (terminal.includes(status) || terminal.includes(paymentStatus)) return review('post_approval_conflict');
		if (
			status === 'approved' &&
			(paymentStatus !== 'approved' ||
				!hasConfirmedPaidAmount(attempt, amount, order.total_paid_amount, payment.paid_amount))
		)
			return review('post_approval_amount_mismatch');
		if (status === 'approved' && paymentStatus === 'approved') {
			const paid = Number(order.total_paid_amount!.replace('.', ''));
			if (attempt.providerPaidAmountInCents === null) return { kind: 'enrich', providerPaidAmountInCents: paid };
			if (attempt.providerPaidAmountInCents !== undefined && attempt.providerPaidAmountInCents !== paid)
				return review('post_approval_amount_mismatch');
		}
		return { kind: 'ignore' }; // duplicata ou observação antiga; não rebaixar nem estornar
	}
	if (attempt.status === 'approved') return review('approved_without_ledger');
	if (terminal.includes(attempt.status)) {
		if (status === 'approved' || paymentStatus === 'approved') return review('late_approval');
		return { kind: 'ignore' };
	}
	const identifiers = {
		providerOrderId: order.id,
		providerPaymentId: payment.id,
		providerStatus: order.status,
		providerStatusDetail: order.status_detail,
	};
	if (status === 'approved' || paymentStatus === 'approved') {
		if (
			status !== 'approved' ||
			paymentStatus !== 'approved' ||
			!hasConfirmedPaidAmount(attempt, amount, order.total_paid_amount, payment.paid_amount)
		)
			return review('remote_paid_amount_mismatch');
		if (charge.status !== 'open' || charge.appointmentStatus !== 'completed' || charge.isPaid)
			return review('charge_not_available');
		try {
			const balance = calculateChargeBalance(charge.totalInCents, payments);
			if (balance.balanceInCents < attempt.amountInCents) return review('payment_exceeds_balance');
			return {
				kind: 'credit',
				providerPaidAmountInCents: Number(order.total_paid_amount!.replace('.', '')),
				status,
				...identifiers,
				settlesCharge: balance.balanceInCents === attempt.amountInCents,
			};
		} catch {
			return review('invalid_ledger');
		}
	}
	if (terminal.includes(status)) {
		if (
			status !== paymentStatus ||
			order.total_paid_amount !== '0.00' ||
			(payment.paid_amount !== undefined && payment.paid_amount !== '0.00')
		)
			return review('terminal_status_conflict');
		return { kind: 'update', status, ...identifiers, settlesCharge: false };
	}
	// Não regredir pending para created/processing em uma leitura atrasada.
	if (attempt.status === 'pending' && status !== 'pending') return { kind: 'ignore' };
	if (terminal.includes(paymentStatus)) return review('remote_status_conflict');
	return {
		kind: 'update',
		status: status === 'created' ? 'processing' : status,
		...identifiers,
		settlesCharge: false,
	};
}

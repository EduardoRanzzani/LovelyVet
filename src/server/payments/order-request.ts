import 'server-only';
import type { OnlinePaymentInput } from '@/api/schema/online-payment.schema';
import { formatMercadoPagoAmount, getMercadoPagoOrderClient } from '@/lib/integrations/mercado-pago';
import type { OnlinePaymentEnvironment } from '@/lib/finance/online-payment-scope';

export type ReservedPayment = {
	id: string;
	chargeId: string;
	amountInCents: number;
	payerEmail: string;
	environment: OnlinePaymentEnvironment;
	collectorId: string;
};

type OrderRequest = Parameters<ReturnType<typeof getMercadoPagoOrderClient>['create']>[0];

export function buildOrderRequest(attempt: ReservedPayment, input: OnlinePaymentInput): OrderRequest {
	if (attempt.chargeId !== input.chargeId) throw new Error('Tentativa incompatível.');
	const amount = formatMercadoPagoAmount(attempt.amountInCents);
	const payer =
		attempt.environment === 'test'
			? input.method === 'pix'
				? { email: 'test_user_br@testuser.com', first_name: 'APRO' }
				: { email: 'test@testuser.com' }
			: { email: attempt.payerEmail };
	return {
		body: {
			type: 'online',
			processing_mode: 'automatic',
			total_amount: amount,
			external_reference: attempt.id,
			payer: {
				...payer,
				...(input.method === 'credit_card' && input.identification
					? { identification: input.identification }
					: {}),
			},
			transactions: {
				payments: [
					{
						amount,
						payment_method:
							input.method === 'pix'
								? { id: 'pix', type: 'bank_transfer' }
								: {
										id: input.paymentMethodId,
										type: 'credit_card',
										token: input.token,
										installments: input.installments,
									},
					},
				],
			},
		},
		requestOptions: { idempotencyKey: attempt.id },
	};
}

// Resposta inicial não é prova de recebimento. Não armazenar payload bruto.
export function readOrderIdentifiers(response: unknown, attempt: ReservedPayment) {
	if (!response || typeof response !== 'object') throw new Error('Resposta Orders inválida.');
	const order = response as {
		id?: unknown;
		external_reference?: unknown;
		total_amount?: unknown;
		status?: unknown;
		status_detail?: unknown;
		transactions?: { payments?: { id?: unknown; amount?: unknown }[] };
	};
	const payments = order.transactions?.payments;
	const payment = Array.isArray(payments) && payments.length === 1 ? payments[0] : undefined;
	const validId = (value: unknown): value is string =>
		typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
	const amount = formatMercadoPagoAmount(attempt.amountInCents);
	if (
		!payment ||
		!validId(order.id) ||
		!validId(payment.id) ||
		order.external_reference !== attempt.id ||
		order.total_amount !== amount ||
		payment.amount !== amount
	) {
		throw new Error('Resposta Orders incompatível com a tentativa.');
	}
	return {
		providerOrderId: order.id,
		providerPaymentId: payment.id,
		providerStatus: validId(order.status) ? order.status : null,
		providerStatusDetail: validId(order.status_detail) ? order.status_detail : null,
	};
}

import { describe, expect, it } from 'vitest';
import { planReconciliation, readReconciliationReference } from './reconciliation-policy';

const attempt = {
	id: 'c943e3cd-d2bb-4c19-a386-5a8e56899128',
	collectorId: '123',
	environment: 'test',
	amountInCents: 15000,
	method: 'pix',
	installments: 1,
	status: 'processing',
	providerOrderId: null,
	providerPaymentId: null,
};
const charge = { status: 'open', totalInCents: 15000, appointmentStatus: 'completed', isPaid: false };
const payment = {
	id: 'PAY123',
	amount: '150.00',
	paid_amount: '150.00',
	status: 'processed',
	status_detail: 'accredited',
	payment_method: { id: 'pix', type: 'bank_transfer' },
};
const order = {
	id: 'ORD123',
	external_reference: attempt.id,
	user_id: '123',
	country_code: 'BRA',
	currency: 'BRL',
	live_mode: false,
	type: 'online',
	processing_mode: 'automatic',
	total_amount: '150.00',
	total_paid_amount: '150.00',
	status: 'processed',
	status_detail: 'accredited',
	transactions: { payments: [payment] },
};
const ledger = {
	amountInCents: 15000,
	onlinePaymentAttemptId: attempt.id,
	operationKey: attempt.id,
	source: 'mercado_pago',
	method: 'pix',
};
const pending = {
	...order,
	status: 'action_required',
	status_detail: 'waiting_payment',
	total_paid_amount: '0.00',
	transactions: {
		payments: [{ ...payment, status: 'action_required', status_detail: 'waiting_payment', paid_amount: '0.00' }],
	},
};
const rejected = {
	...order,
	status: 'failed',
	status_detail: 'failed',
	total_paid_amount: '0.00',
	transactions: { payments: [{ ...payment, status: 'failed', status_detail: 'failed', paid_amount: '0.00' }] },
};

describe('referência autenticada', () => {
	it('recupera tentativa pelo UUID quando a resposta inicial foi perdida', () =>
		expect(readReconciliationReference(order, order.id)).toBe(attempt.id));
	it('ignora referência de outra aplicação', () =>
		expect(readReconciliationReference({ ...order, external_reference: 'pedido-99' }, order.id)).toBeNull());
	it('rejeita retorno de ID diferente', () => expect(() => readReconciliationReference(order, 'ORD999')).toThrow());
});

describe('política de conciliação', () => {
	it('aprova somente com confirmação integral de order e pagamento', () =>
		expect(planReconciliation(order, order.id, attempt, charge, [])).toMatchObject({
			kind: 'credit',
			status: 'approved',
			settlesCharge: true,
			providerPaymentId: 'PAY123',
		}));
	it('mantém pagamento pendente fora do ledger', () =>
		expect(planReconciliation(pending, order.id, attempt, charge, [])).toMatchObject({
			kind: 'update',
			status: 'pending',
		}));
	it('libera rejeição confirmada sem recebimento', () =>
		expect(planReconciliation(rejected, order.id, attempt, charge, [])).toMatchObject({
			kind: 'update',
			status: 'rejected',
		}));
	it('não repete recebimento aprovado', () =>
		expect(planReconciliation(order, order.id, { ...attempt, status: 'approved' }, charge, [ledger])).toEqual({
			kind: 'ignore',
		}));
	it('não rebaixa aprovação por resposta pendente atrasada', () =>
		expect(planReconciliation(pending, order.id, { ...attempt, status: 'approved' }, charge, [ledger])).toEqual({
			kind: 'ignore',
		}));
	it('preserva revisão até resolução humana', () =>
		expect(planReconciliation(order, order.id, { ...attempt, status: 'review' }, charge, [])).toEqual({
			kind: 'ignore',
		}));
	it('aprovação tardia após rejeição exige revisão', () =>
		expect(planReconciliation(order, order.id, { ...attempt, status: 'rejected' }, charge, [])).toMatchObject({
			kind: 'review',
			reason: 'late_approval',
		}));
	it('não aceita aprovado sem ledger', () =>
		expect(planReconciliation(order, order.id, { ...attempt, status: 'approved' }, charge, [])).toMatchObject({
			kind: 'review',
		}));
	it('sinaliza estorno sem remover recebimento', () =>
		expect(
			planReconciliation({ ...order, status: 'refunded' }, order.id, { ...attempt, status: 'approved' }, charge, [
				ledger,
			]),
		).toMatchObject({ kind: 'review' }));
	it.each([
		{ user_id: '999' },
		{ live_mode: true },
		{ total_amount: '149.00' },
		{ total_paid_amount: '149.00' },
		{ total_paid_amount: undefined },
		{ country_code: 'ARG' },
		{ currency: 'USD' },
		{ transactions: { payments: [payment, payment] } },
		{ transactions: { payments: [{ ...payment, paid_amount: '0.00' }] } },
		{ transactions: { payments: [{ ...payment, payment_method: { id: 'visa', type: 'credit_card' } }] } },
		{ transactions: { payments: [payment], refunds: [{}] } },
		{ transactions: { payments: [{ ...payment, status: 'action_required', status_detail: 'waiting_payment' }] } },
	])('sinaliza divergência remota %j', (patch) =>
		expect(planReconciliation({ ...order, ...patch }, order.id, attempt, charge, [])).toMatchObject({
			kind: 'review',
		}),
	);
	it('não substitui identificador já persistido', () =>
		expect(planReconciliation(order, order.id, { ...attempt, providerOrderId: 'OTHER' }, charge, [])).toMatchObject(
			{ kind: 'review' },
		));
	it('não baixa cobrança cancelada', () =>
		expect(planReconciliation(order, order.id, attempt, { ...charge, status: 'void' }, [])).toMatchObject({
			kind: 'review',
		}));
	it('não excede o saldo após recebimento manual', () =>
		expect(
			planReconciliation(order, order.id, attempt, charge, [
				{ ...ledger, amountInCents: 100, onlinePaymentAttemptId: null, source: 'manual' },
			]),
		).toMatchObject({ kind: 'review', reason: 'payment_exceeds_balance' }));
	it('aceita saldo remanescente após recebimento parcial', () =>
		expect(
			planReconciliation(order, order.id, attempt, { ...charge, totalInCents: 20000 }, [
				{ ...ledger, amountInCents: 5000, onlinePaymentAttemptId: null, source: 'manual' },
			]),
		).toMatchObject({ kind: 'credit', settlesCharge: true }));
});

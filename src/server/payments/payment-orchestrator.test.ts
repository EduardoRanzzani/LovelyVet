import { describe, expect, it, vi } from 'vitest';
import { buildOrderRequest, readOrderIdentifiers, type ReservedPayment } from './order-request';
import { submitOnlinePayment } from './payment-orchestrator';
import type { OnlinePaymentInput } from '@/api/schema/online-payment.schema';

const attempt: ReservedPayment = {
	id: 'c943e3cd-d2bb-4c19-a386-5a8e56899128',
	chargeId: '5144e9bb-a20d-48d0-b50b-b1a4bb93fe2e',
	amountInCents: 15001,
	payerEmail: 'tutor@example.com',
	environment: 'test',
	collectorId: '123',
};
const pix = { chargeId: attempt.chargeId, method: 'pix' } as const;
const card: OnlinePaymentInput = {
	chargeId: attempt.chargeId,
	method: 'credit_card',
	token: 'token-ficticio',
	paymentMethodId: 'visa',
	installments: 2,
};
const response = {
	id: 'ORD123',
	external_reference: attempt.id,
	total_amount: '150.01',
	status: 'processed',
	status_detail: 'accredited',
	transactions: { payments: [{ id: 'PAY123', amount: '150.01' }] },
};
function dependencies() {
	return {
		reserve: vi.fn(async () => attempt),
		createOrder: vi.fn(async () => response),
		persist: vi.fn(async () => {}),
		markUncertain: vi.fn(async () => {}),
	};
}

describe('Orders', () => {
	it('gera Pix com valor e referência exclusivos da tentativa', () => {
		const request = buildOrderRequest(attempt, pix);
		expect(request.body).toMatchObject({
			total_amount: '150.01',
			external_reference: attempt.id,
			payer: { email: 'test_user_br@testuser.com' },
			transactions: { payments: [{ amount: '150.01', payment_method: { id: 'pix', type: 'bank_transfer' } }] },
		});
		expect(request.requestOptions).toEqual({ idempotencyKey: attempt.id });
	});
	it('gera cartão tokenizado com a mesma referência e e-mail do tutor em produção', () => {
		const request = buildOrderRequest({ ...attempt, environment: 'production' }, card);
		expect(request.body).toMatchObject({
			payer: { email: attempt.payerEmail },
			transactions: {
				payments: [
					{ payment_method: { id: 'visa', type: 'credit_card', token: 'token-ficticio', installments: 2 } },
				],
			},
		});
		expect(request.requestOptions).toEqual({ idempotencyKey: attempt.id });
	});
	it('rejeita cobrança diferente', () => {
		expect(() => buildOrderRequest(attempt, { ...pix, chargeId: 'outro' })).toThrow('incompatível');
	});
	it.each([
		{ ...response, external_reference: 'outra' },
		{ ...response, total_amount: '1.00' },
		{ ...response, transactions: { payments: [] } },
		{ ...response, transactions: { payments: [{ id: 'PAY123', amount: '1.00' }] } },
		{ ...response, id: '../order' },
	])('rejeita resposta incompatível %#', (value) => {
		expect(() => readOrderIdentifiers(value, attempt)).toThrow('incompatível');
	});
	it('reserva antes da rede e não baixa pagamento aprovado', async () => {
		const deps = dependencies();
		const result = await submitOnlinePayment(pix, deps);
		expect(deps.reserve.mock.invocationCallOrder[0]).toBeLessThan(deps.createOrder.mock.invocationCallOrder[0]);
		expect(deps.persist).toHaveBeenCalledWith(attempt, {
			providerOrderId: 'ORD123',
			providerPaymentId: 'PAY123',
			providerStatus: 'processed',
			providerStatusDetail: 'accredited',
		});
		expect(result).toEqual({ attemptId: attempt.id, status: 'processing', needsReconciliation: true });
	});
	it('não chama provedor quando reserva falha', async () => {
		const deps = dependencies();
		deps.reserve.mockRejectedValueOnce(new Error('sem acesso'));
		await expect(submitOnlinePayment(pix, deps)).rejects.toThrow('sem acesso');
		expect(deps.createOrder).not.toHaveBeenCalled();
	});
	it('timeout preserva tentativa sem repetir requisição nem expor erro', async () => {
		const deps = dependencies();
		deps.createOrder.mockRejectedValueOnce(new Error('token-confidencial'));
		const result = await submitOnlinePayment(card, deps);
		expect(deps.createOrder).toHaveBeenCalledTimes(1);
		expect(deps.markUncertain).toHaveBeenCalledWith(attempt);
		expect(deps.persist).not.toHaveBeenCalled();
		expect(result).toEqual({ attemptId: attempt.id, status: 'processing', needsReconciliation: true });
	});
	it('falha de persistência mantém tentativa bloqueada', async () => {
		const deps = dependencies();
		deps.persist.mockRejectedValueOnce(new Error('db'));
		await expect(submitOnlinePayment(pix, deps)).resolves.toMatchObject({ status: 'processing' });
		expect(deps.markUncertain).toHaveBeenCalledWith(attempt);
	});
	it('falha ao sinalizar incerteza não vaza erro nem libera reserva', async () => {
		const deps = dependencies();
		deps.createOrder.mockRejectedValueOnce(new Error('timeout'));
		deps.markUncertain.mockRejectedValueOnce(new Error('db'));
		await expect(submitOnlinePayment(pix, deps)).resolves.toMatchObject({ status: 'processing' });
		expect(deps.createOrder).toHaveBeenCalledTimes(1);
	});
});

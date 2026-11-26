import { describe, expect, it } from 'vitest';
import {
	assertExpectedOnlinePaymentBalance,
	assertNoBlockingOnlinePayment,
	getOnlinePaymentAmount,
} from './online-payment-reservation';

describe('reserva do saldo online', () => {
	it('usa exclusivamente o saldo restante', () => {
		expect(getOnlinePaymentAmount({ status: 'open', totalInCents: 25000 }, [{ amountInCents: 10000 }])).toBe(15000);
	});
	it('rejeita cobrança cancelada', () => {
		expect(() => getOnlinePaymentAmount({ status: 'void', totalInCents: 100 }, [])).toThrow('não está aberta');
	});
	it('rejeita cobrança quitada', () => {
		expect(() => getOnlinePaymentAmount({ status: 'open', totalInCents: 100 }, [{ amountInCents: 100 }])).toThrow(
			'quitada',
		);
	});
	it('rejeita ledger inconsistente', () => {
		expect(() => getOnlinePaymentAmount({ status: 'open', totalInCents: 100 }, [{ amountInCents: 101 }])).toThrow(
			'excedem',
		);
	});
	it.each(['created', 'processing', 'pending', 'review', 'approved', 'unknown'])('bloqueia %s', (status) => {
		expect(() => assertNoBlockingOnlinePayment([{ status }])).toThrow('aguardando resolução');
	});
	it('permite nova tentativa após encerramento confirmado', () => {
		expect(() =>
			assertNoBlockingOnlinePayment(['cancelled', 'rejected', 'expired'].map((status) => ({ status }))),
		).not.toThrow();
	});
});

describe('saldo esperado do cartão', () => {
	const card = {
		chargeId: 'c943e3cd-d2bb-4c19-a386-5a8e56899128',
		method: 'credit_card' as const,
		expectedBalanceInCents: 20000,
		token: 'fake_token',
		paymentMethodId: 'visa',
		installments: 1,
	};
	it('aceita saldo idêntico ao apresentado', () => {
		expect(() => assertExpectedOnlinePaymentBalance(card, 20000)).not.toThrow();
	});
	it.each([15000, 25000])('rejeita saldo alterado para %i centavos', (balance) => {
		expect(() => assertExpectedOnlinePaymentBalance(card, balance)).toThrow('saldo da cobrança mudou');
	});
	it('mantém Pix calculado exclusivamente pelo servidor', () => {
		expect(() =>
			assertExpectedOnlinePaymentBalance({ chargeId: card.chargeId, method: 'pix' }, 15000),
		).not.toThrow();
	});
});

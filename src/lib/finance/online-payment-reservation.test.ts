import { describe, expect, it } from 'vitest';
import { assertNoBlockingOnlinePayment, getOnlinePaymentAmount } from './online-payment-reservation';

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

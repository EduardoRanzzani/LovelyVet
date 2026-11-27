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

describe('pagamento parcial sequencial', () => {
	const charge = { status: 'open', totalInCents: 20000 };
	const input = { chargeId: 'charge', method: 'pix' as const, amountInCents: 10000, expectedBalanceInCents: 20000 };
	const attempt = { id: 'attempt', status: 'approved', amountInCents: 10000, method: 'pix' };
	const receipt = {
		onlinePaymentAttemptId: attempt.id,
		operationKey: attempt.id,
		amountInCents: 10000,
		method: 'pix',
		source: 'mercado_pago',
	};
	it('reserva somente o principal solicitado', () => expect(getOnlinePaymentAmount(charge, [], input)).toBe(10000));
	it('rejeita Pix parcial com saldo desatualizado', () =>
		expect(() => getOnlinePaymentAmount(charge, [receipt], input)).toThrow('saldo da cobrança mudou'));
	it.each([0, -1, 20001, 1.5])('rejeita valor inválido %s sob lock', (amountInCents) =>
		expect(() => getOnlinePaymentAmount(charge, [], { ...input, amountInCents })).toThrow('não pode exceder'),
	);
	it('libera próximo recebimento apenas após aprovação conciliada', () => {
		expect(() => assertNoBlockingOnlinePayment([attempt], [receipt])).not.toThrow();
		expect(getOnlinePaymentAmount(charge, [receipt], { ...input, expectedBalanceInCents: 10000 })).toBe(10000);
	});
	it.each([
		{ source: 'manual' },
		{ amountInCents: 9999 },
		{ method: 'credit_card' },
		{ operationKey: 'other' },
		{ onlinePaymentAttemptId: 'other' },
	])('bloqueia recebimento incompatível %j', (patch) =>
		expect(() => assertNoBlockingOnlinePayment([attempt], [{ ...receipt, ...patch }])).toThrow(
			'aguardando resolução',
		),
	);
	it('bloqueia mesmo com aprovação anterior conciliada se existir review', () =>
		expect(() => assertNoBlockingOnlinePayment([attempt, { status: 'review' }], [receipt])).toThrow(
			'aguardando resolução',
		));
	it('bloqueia recebimentos duplicados', () =>
		expect(() => assertNoBlockingOnlinePayment([attempt], [receipt, receipt])).toThrow('aguardando resolução'));
});

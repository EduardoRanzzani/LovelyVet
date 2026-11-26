import { describe, expect, it } from 'vitest';
import { onlinePaymentSchema } from './online-payment.schema';
const chargeId = 'c943e3cd-d2bb-4c19-a386-5a8e56899128';
const pix = { chargeId, method: 'pix' };
const card = {
	chargeId,
	method: 'credit_card',
	expectedBalanceInCents: 20000,
	token: 'token-ficticio',
	paymentMethodId: 'visa',
	installments: 2,
};

describe('entrada de pagamento online', () => {
	it.each([pix, card, { ...card, identification: { type: 'CPF', number: '12345678901' } }])(
		'aceita $method',
		(input) => {
			expect(onlinePaymentSchema.safeParse(input).success).toBe(true);
		},
	);
	it.each([
		{ ...pix, amountInCents: 1 },
		{ ...pix, environment: 'test' },
		{ ...pix, customerId: chargeId },
		{ ...pix, chargeId: 'x' },
		{ ...card, expectedBalanceInCents: undefined },
		{ ...card, expectedBalanceInCents: 0 },
		{ ...card, expectedBalanceInCents: -1 },
		{ ...card, expectedBalanceInCents: 1.5 },
		{ ...card, expectedBalanceInCents: '20000' },
		{ ...card, expectedBalanceInCents: Number.MAX_SAFE_INTEGER + 1 },
		{ ...pix, expectedBalanceInCents: 20000 },
		{ ...card, amountInCents: 20000 },
		{ ...card, installments: 25 },
		{ ...card, installments: 0 },
		{ ...card, token: '' },
		{ ...card, cardNumber: '1234' },
		{ ...card, cvv: '123' },
		{ ...card, method: 'debit_card' },
		{ ...card, paymentMethodId: '../pix' },
		{ ...card, identification: { type: 'CPF', number: '1' } },
	])('rejeita entrada indevida %#', (input) => {
		expect(onlinePaymentSchema.safeParse(input).success).toBe(false);
	});
});

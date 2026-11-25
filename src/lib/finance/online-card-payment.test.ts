import { describe, expect, it } from 'vitest';
import { buildCardPaymentPayload } from './online-card-payment';

const chargeId = 'c943e3cd-d2bb-4c19-a386-5a8e56899128';
const form = {
	token: 'token_teste',
	payment_method_id: 'visa',
	installments: 2,
	transaction_amount: 200,
	payer: { email: 'ignored@example.test', identification: { type: 'CPF', number: '123.456.789-00' } },
	issuer_id: 'ignored',
	cardholderName: 'ignored',
};
describe('card payment payload', () => {
	it('sends only fields permitted by the server schema', () => {
		expect(buildCardPaymentPayload(chargeId, 20000, form, 'credit_card')).toEqual({
			chargeId,
			method: 'credit_card',
			token: 'token_teste',
			paymentMethodId: 'visa',
			installments: 2,
			identification: { type: 'CPF', number: '12345678900' },
		});
	});
	it.each(['debit_card', 'prepaid_card', undefined])('rejects unsupported or unknown card type %s', (type) => {
		expect(buildCardPaymentPayload(chargeId, 20000, form, type)).toBeNull();
	});
	it('rejects amount mismatch', () => {
		expect(buildCardPaymentPayload(chargeId, 19999, form, 'credit_card')).toBeNull();
	});
	it('rejects invalid installments', () => {
		expect(buildCardPaymentPayload(chargeId, 20000, { ...form, installments: 25 }, 'credit_card')).toBeNull();
	});
	it('rejects invalid token', () => {
		expect(buildCardPaymentPayload(chargeId, 20000, { ...form, token: '' }, 'credit_card')).toBeNull();
	});
	it('rejects invalid identification', () => {
		expect(
			buildCardPaymentPayload(
				chargeId,
				20000,
				{ ...form, payer: { identification: { type: 'CPF', number: '123' } } },
				'credit_card',
			),
		).toBeNull();
	});
	it('allows absent optional identification', () => {
		expect(buildCardPaymentPayload(chargeId, 20000, { ...form, payer: undefined }, 'credit_card')).toEqual({
			chargeId,
			method: 'credit_card',
			token: 'token_teste',
			paymentMethodId: 'visa',
			installments: 2,
		});
	});
});

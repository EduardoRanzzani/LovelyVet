import { describe, expect, it } from 'vitest';
import { assertOnlinePaymentScope, PAYMENT_TEST_PET_ID } from './online-payment-scope';

const realPet = '00000000-0000-4000-8000-000000000001';

describe('escopo de pagamentos online em banco compartilhado', () => {
	it('permite teste no pet reservado', () => {
		expect(() => assertOnlinePaymentScope({ environment: 'test', petId: PAYMENT_TEST_PET_ID })).not.toThrow();
	});
	it('rejeita teste em qualquer outro pet', () => {
		expect(() => assertOnlinePaymentScope({ environment: 'test', petId: realPet })).toThrow();
	});
	it('permite pagamento real em pet não reservado', () => {
		expect(() => assertOnlinePaymentScope({ environment: 'production', petId: realPet })).not.toThrow();
	});
	it('rejeita pagamento real no pet reservado', () => {
		expect(() => assertOnlinePaymentScope({ environment: 'production', petId: PAYMENT_TEST_PET_ID })).toThrow();
	});
	it('rejeita conciliação de produção no ambiente de teste', () => {
		expect(() =>
			assertOnlinePaymentScope({
				environment: 'test',
				petId: PAYMENT_TEST_PET_ID,
				attemptEnvironment: 'production',
			}),
		).toThrow();
	});
	it('rejeita conciliação de teste no ambiente de produção', () => {
		expect(() =>
			assertOnlinePaymentScope({ environment: 'production', petId: realPet, attemptEnvironment: 'test' }),
		).toThrow();
	});
});

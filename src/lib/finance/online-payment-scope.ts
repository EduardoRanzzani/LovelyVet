export type OnlinePaymentEnvironment = 'test' | 'production';

// O banco é compartilhado por decisão explícita. Testes financeiros somente neste pet.
export const PAYMENT_TEST_PET_ID = 'c943e3cd-d2bb-4c19-a386-5a8e56899128';

export function assertOnlinePaymentScope(input: {
	environment: OnlinePaymentEnvironment;
	petId: string;
	attemptEnvironment?: OnlinePaymentEnvironment;
}) {
	if (input.attemptEnvironment !== undefined && input.attemptEnvironment !== input.environment) {
		throw new Error('Ambiente da tentativa de pagamento incompatível.');
	}
	if (input.environment === 'test' && input.petId !== PAYMENT_TEST_PET_ID) {
		throw new Error('Pagamento de teste permitido somente no pet de homologação.');
	}
	if (input.environment === 'production' && input.petId === PAYMENT_TEST_PET_ID) {
		throw new Error('Pagamento real não permitido no pet de homologação.');
	}
}

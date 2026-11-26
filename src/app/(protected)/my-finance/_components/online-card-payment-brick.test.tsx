import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import type { CardPayment } from '@mercadopago/sdk-react';

const mocks = vi.hoisted(() => ({ init: vi.fn(), submitResult: vi.fn(), customization: vi.fn() }));
vi.mock('@mercadopago/sdk-react', () => ({
	initMercadoPago: mocks.init,
	CardPayment: ({ onSubmit, customization }: ComponentProps<typeof CardPayment>) => {
		mocks.customization(customization);
		return (
			<button
				type='button'
				onClick={() => {
					void onSubmit(
						{
							token: 'fake_token',
							payment_method_id: 'visa',
							issuer_id: 'test',
							transaction_amount: 200,
							installments: 1,
							payer: {},
						},
						{ bin: 'ignored', lastFourDigits: 'ignored', paymentTypeId: 'credit_card' },
					).then(
						() => mocks.submitResult(true),
						() => mocks.submitResult(false),
					);
				}}
			>
				Simular envio do Brick
			</button>
		);
	},
}));
let Brick: typeof import('./online-card-payment-brick').default;
beforeAll(async () => {
	vi.stubEnv('NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY', 'TEST-placeholder');
	Brick = (await import('./online-card-payment-brick')).default;
});
afterAll(() => vi.unstubAllEnvs());
const chargeId = 'c943e3cd-d2bb-4c19-a386-5a8e56899128';
describe('OnlineCardPaymentBrick', () => {
	beforeEach(() => {
		mocks.submitResult.mockClear();
		mocks.customization.mockClear();
	});
	it('hides the payment button in preview and refuses even a forced callback', async () => {
		const onPayment = vi.fn().mockResolvedValue(true);
		render(<Brick chargeId={chargeId} balanceInCents={20000} canSubmit={false} onPayment={onPayment} />);
		expect(mocks.customization).toHaveBeenCalledWith(
			expect.objectContaining({
				visual: expect.objectContaining({ hidePaymentButton: true }),
				paymentMethods: expect.objectContaining({ types: { excluded: ['debit_card', 'prepaid_card'] } }),
			}),
		);
		fireEvent.click(screen.getByRole('button', { name: 'Simular envio do Brick' }));
		await waitFor(() => expect(mocks.submitResult).toHaveBeenCalledWith(false));
		expect(onPayment).not.toHaveBeenCalled();
	});
	it('sends the normalized tokenized payload when permitted', async () => {
		const onPayment = vi.fn().mockResolvedValue(true);
		render(<Brick chargeId={chargeId} balanceInCents={20000} canSubmit onPayment={onPayment} />);
		fireEvent.click(screen.getByRole('button', { name: 'Simular envio do Brick' }));
		await waitFor(() =>
			expect(onPayment).toHaveBeenCalledExactlyOnceWith({
				chargeId,
				method: 'credit_card',
				expectedBalanceInCents: 20000,
				token: 'fake_token',
				paymentMethodId: 'visa',
				installments: 1,
			}),
		);
		await waitFor(() => expect(mocks.submitResult).toHaveBeenCalledWith(true));
	});
});

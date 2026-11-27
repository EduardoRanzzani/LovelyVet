import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OnlinePaymentCheckout } from './online-payment-checkout';
const mocks = vi.hoisted(() => ({ start: vi.fn(), sync: vi.fn(), refresh: vi.fn() }));
vi.mock('@/api/actions/online-payment.actions', () => ({
	startOnlinePayment: mocks.start,
	syncOnlinePayment: mocks.sync,
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock('./online-card-payment-brick', () => ({
	default: ({
		canSubmit,
		balanceInCents,
		onPayment,
		chargeId,
	}: {
		canSubmit: boolean;
		balanceInCents: number;
		onPayment: (input: {
			chargeId: string;
			method: 'credit_card';
			expectedBalanceInCents: number;
			token: string;
			paymentMethodId: string;
			installments: number;
		}) => Promise<boolean>;
		chargeId: string;
	}) => (
		<button
			type='button'
			disabled={!canSubmit}
			onClick={() =>
				void onPayment({
					chargeId,
					method: 'credit_card',
					expectedBalanceInCents: balanceInCents,
					token: 'fake_token',
					paymentMethodId: 'visa',
					installments: 1,
				})
			}
		>
			Enviar cartão de teste
		</button>
	),
}));
const props = {
	chargeId: 'charge',
	balanceInCents: 20000,
	option: { canStart: false, attemptId: null, testMode: true },
};

describe('OnlinePaymentCheckout', () => {
	beforeEach(() => vi.resetAllMocks());
	it('shows the preview without creating payments', () => {
		render(<OnlinePaymentCheckout {...props} />);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Gerar Pix' })).toBeDisabled();
		expect(mocks.start).not.toHaveBeenCalled();
	});
	it('sends only the charge ID and method when creation is enabled', async () => {
		mocks.start.mockResolvedValue({ data: { attemptId: 'attempt', status: 'processing' } });
		render(<OnlinePaymentCheckout {...props} option={{ ...props.option, canStart: true }} />);
		fireEvent.click(screen.getByRole('button', { name: 'Gerar Pix' }));
		await waitFor(() => expect(mocks.start).toHaveBeenCalledWith({ chargeId: 'charge', method: 'pix' }));
		expect(await screen.findByRole('button', { name: 'Atualizar situação' })).toBeInTheDocument();
	});
	it('shows the initial Pix code without waiting for polling or requiring a PNG', async () => {
		mocks.start.mockResolvedValue({
			data: {
				attemptId: 'attempt',
				snapshot: {
					status: 'pending',
					amountInCents: 20000,
					pix: { code: '000201TESTE', pngBase64: null },
					remoteUnavailable: false,
					retryAfterSeconds: 15,
				},
			},
		});
		render(<OnlinePaymentCheckout {...props} option={{ ...props.option, canStart: true }} />);
		fireEvent.click(screen.getByRole('button', { name: 'Gerar Pix' }));
		expect(await screen.findByRole('textbox', { name: 'Código Pix' })).toHaveValue('000201TESTE');
		expect(screen.queryByRole('img', { name: 'QR Code Pix' })).not.toBeInTheDocument();
		expect(mocks.sync).not.toHaveBeenCalled();
		mocks.sync.mockResolvedValue({
			data: {
				status: 'approved',
				amountInCents: 20000,
				pix: null,
				remoteUnavailable: false,
				retryAfterSeconds: 15,
			},
		});
		fireEvent.click(screen.getByRole('button', { name: 'Atualizar situação' }));
		await screen.findByText('Pagamento confirmado. Consulte o saldo atualizado.');
		expect(screen.queryByRole('textbox', { name: 'Código Pix' })).not.toBeInTheDocument();
	});
	it('shows a PNG and the explicit validity when the initial Pix is pending', async () => {
		mocks.start.mockResolvedValue({
			data: {
				attemptId: 'attempt',
				snapshot: {
					status: 'pending',
					amountInCents: 20000,
					pix: { code: '000201TESTE', pngBase64: 'aW1hZ2U=', expiresAt: '2026-11-27T16:00:00Z' },
					remoteUnavailable: false,
					retryAfterSeconds: 15,
				},
			},
		});
		render(<OnlinePaymentCheckout {...props} option={{ ...props.option, canStart: true }} />);
		fireEvent.click(screen.getByRole('button', { name: 'Gerar Pix' }));
		expect(await screen.findByRole('img', { name: 'QR Code Pix' })).toHaveAttribute(
			'src',
			'data:image/png;base64,aW1hZ2U=',
		);
		expect(screen.getByText(/Validade informada:/)).toBeInTheDocument();
	});
	it('recovers existing attempts without creating a new payment', async () => {
		mocks.sync.mockResolvedValue({
			data: {
				status: 'approved',
				amountInCents: 20000,
				pix: null,
				remoteUnavailable: false,
				retryAfterSeconds: 15,
			},
		});
		render(<OnlinePaymentCheckout {...props} option={{ ...props.option, attemptId: 'attempt' }} />);
		fireEvent.click(screen.getByRole('button', { name: 'Atualizar situação' }));
		expect(await screen.findByText('Pagamento confirmado. Consulte o saldo atualizado.')).toBeInTheDocument();
		expect(mocks.sync).toHaveBeenCalledWith({ attemptId: 'attempt' });
		expect(mocks.start).not.toHaveBeenCalled();
		expect(mocks.refresh).toHaveBeenCalled();
	});
	it('shows the card preview without enabling submission', async () => {
		render(<OnlinePaymentCheckout {...props} />);
		fireEvent.click(screen.getByRole('button', { name: /Cartão de crédito/ }));
		expect(await screen.findByRole('button', { name: 'Enviar cartão de teste' })).toBeDisabled();
		expect(mocks.start).not.toHaveBeenCalled();
	});
	it('passes the tokenized card payload to the existing action and tracks the attempt', async () => {
		mocks.start.mockResolvedValue({ data: { attemptId: 'attempt', status: 'processing' } });
		render(<OnlinePaymentCheckout {...props} option={{ ...props.option, canStart: true }} />);
		fireEvent.click(screen.getByRole('button', { name: /Cartão de crédito/ }));
		fireEvent.click(await screen.findByRole('button', { name: 'Enviar cartão de teste' }));
		await waitFor(() =>
			expect(mocks.start).toHaveBeenCalledExactlyOnceWith({
				chargeId: 'charge',
				method: 'credit_card',
				expectedBalanceInCents: 20000,
				token: 'fake_token',
				paymentMethodId: 'visa',
				installments: 1,
			}),
		);
		expect(await screen.findByRole('button', { name: 'Atualizar situação' })).toBeInTheDocument();
	});
	it('blocks a second method after an uncertain submission', async () => {
		mocks.start.mockResolvedValue({});
		render(<OnlinePaymentCheckout {...props} option={{ ...props.option, canStart: true }} />);
		fireEvent.click(screen.getByRole('button', { name: 'Gerar Pix' }));
		await screen.findByText(/Não foi possível confirmar a solicitação/);
		expect(screen.getByRole('button', { name: /Cartão de crédito/ })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Gerar Pix' })).toBeDisabled();
	});
	it('allows a new attempt only after a terminal rejection and refreshed server eligibility', async () => {
		mocks.sync.mockResolvedValue({
			data: {
				status: 'rejected',
				amountInCents: 20000,
				pix: null,
				remoteUnavailable: false,
				retryAfterSeconds: 15,
			},
		});
		const { rerender } = render(
			<OnlinePaymentCheckout {...props} option={{ ...props.option, attemptId: 'attempt' }} />,
		);
		fireEvent.click(screen.getByRole('button', { name: 'Atualizar situação' }));
		await screen.findByText('Pagamento recusado.');
		expect(screen.queryByRole('button', { name: 'Tentar outro pagamento' })).not.toBeInTheDocument();
		rerender(<OnlinePaymentCheckout {...props} option={{ ...props.option, canStart: true }} />);
		fireEvent.click(screen.getByRole('button', { name: 'Tentar outro pagamento' }));
		expect(screen.getByRole('button', { name: 'Gerar Pix' })).toBeEnabled();
		expect(mocks.start).not.toHaveBeenCalled();
	});
	it('tracks an attempt newly returned by server refresh without offering creation', () => {
		const { rerender } = render(<OnlinePaymentCheckout {...props} />);
		rerender(<OnlinePaymentCheckout {...props} option={{ ...props.option, attemptId: 'attempt' }} />);
		expect(screen.getByRole('button', { name: 'Atualizar situação' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Gerar Pix' })).not.toBeInTheDocument();
	});
});

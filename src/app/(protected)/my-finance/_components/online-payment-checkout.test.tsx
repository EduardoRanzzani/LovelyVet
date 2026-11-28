import type { ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OnlinePaymentCheckout } from './online-payment-checkout';
import { OnlinePaymentSuccess } from './online-payment-success';
import type { OnlinePaymentSnapshot } from '@/lib/finance/online-payment-view';
const mocks = vi.hoisted(() => ({ start: vi.fn(), sync: vi.fn(), refresh: vi.fn() }));
vi.mock('@/api/actions/online-payment.actions', () => ({
	startOnlinePayment: mocks.start,
	syncOnlinePayment: mocks.sync,
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock('@/components/shared/page-container', () => {
	const Wrapper = ({ children }: { children: ReactNode }) => <div>{children}</div>;
	return {
		PageContainer: Wrapper,
		PageContent: Wrapper,
		PageHeader: Wrapper,
		PageHeaderContent: Wrapper,
		PageTitle: Wrapper,
	};
});
vi.mock('./online-card-payment-brick', () => ({
	default: ({
		canSubmit,
		balanceInCents,
		amountInCents,
		onPayment,
		chargeId,
	}: {
		canSubmit: boolean;
		balanceInCents: number;
		amountInCents: number;
		onPayment: (input: {
			chargeId: string;
			method: 'credit_card';
			expectedBalanceInCents: number;
			amountInCents: number;
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
					amountInCents,
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
	petName: 'Teste',
	returnHref: '/my-finance?month=2026-11&scope=all',
	option: { canStart: false, attemptId: null, testMode: true },
};

const snapshot = (overrides: Partial<OnlinePaymentSnapshot> = {}): OnlinePaymentSnapshot => ({
	attemptId: 'attempt',
	status: 'pending',
	amountInCents: 20000,
	method: 'pix',
	installments: 1,
	balanceInCents: 20000,
	pix: null,
	retainPix: false,
	remoteUnavailable: false,
	retryAfterSeconds: 15,
	...overrides,
});
const existing = { ...props, option: { ...props.option, attemptId: 'attempt' } };
async function tick(ms: number) {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(ms);
	});
}

describe('OnlinePaymentCheckout', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
	});
	afterEach(() => {
		vi.useRealTimers();
	});
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
		await waitFor(() =>
			expect(mocks.start).toHaveBeenCalledWith({
				chargeId: 'charge',
				method: 'pix',
				expectedBalanceInCents: 20000,
				amountInCents: 20000,
			}),
		);
		expect(await screen.findByText(/Estamos acompanhando seu pagamento/)).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Atualizar situação' })).not.toBeInTheDocument();
	});
	it('shows the initial Pix code without waiting for polling or requiring a PNG', async () => {
		mocks.start.mockResolvedValue({
			data: {
				attemptId: 'attempt',
				snapshot: {
					attemptId: 'attempt',
					status: 'pending',
					amountInCents: 20000,
					method: 'pix',
					installments: 1,
					balanceInCents: 20000,
					retainPix: false,
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
				attemptId: 'attempt',
				status: 'approved',
				amountInCents: 20000,
				method: 'pix',
				installments: 1,
				balanceInCents: 0,
				retainPix: false,
				pix: null,
				remoteUnavailable: false,
				retryAfterSeconds: 15,
			},
		});
		fireEvent(window, new Event('focus'));
		await screen.findByText('Pagamento aprovado!');
		expect(screen.queryByRole('textbox', { name: 'Código Pix' })).not.toBeInTheDocument();
	});
	it('shows a PNG and the explicit validity when the initial Pix is pending', async () => {
		mocks.start.mockResolvedValue({
			data: {
				attemptId: 'attempt',
				snapshot: {
					attemptId: 'attempt',
					status: 'pending',
					amountInCents: 20000,
					method: 'pix',
					installments: 1,
					balanceInCents: 20000,
					retainPix: false,
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
				attemptId: 'attempt',
				status: 'approved',
				amountInCents: 20000,
				method: 'pix',
				installments: 1,
				balanceInCents: 0,
				retainPix: false,
				pix: null,
				remoteUnavailable: false,
				retryAfterSeconds: 15,
			},
		});
		render(<OnlinePaymentCheckout {...props} option={{ ...props.option, attemptId: 'attempt' }} />);
		fireEvent(window, new Event('focus'));
		expect(await screen.findByText('Pagamento aprovado!')).toBeInTheDocument();
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
				amountInCents: 20000,
				token: 'fake_token',
				paymentMethodId: 'visa',
				installments: 1,
			}),
		);
		expect(await screen.findByText(/Estamos acompanhando seu pagamento/)).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Atualizar situação' })).not.toBeInTheDocument();
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
				attemptId: 'attempt',
				status: 'rejected',
				amountInCents: 20000,
				method: 'pix',
				installments: 1,
				balanceInCents: 20000,
				retainPix: false,
				pix: null,
				remoteUnavailable: false,
				retryAfterSeconds: 15,
			},
		});
		const { rerender } = render(
			<OnlinePaymentCheckout {...props} option={{ ...props.option, attemptId: 'attempt' }} />,
		);
		fireEvent(window, new Event('focus'));
		await screen.findByText('Pagamento recusado.');
		expect(screen.queryByRole('button', { name: 'Tentar outro pagamento' })).not.toBeInTheDocument();
		rerender(<OnlinePaymentCheckout {...props} option={{ ...props.option, canStart: true }} />);
		fireEvent.click(screen.getByRole('button', { name: 'Tentar outro pagamento' }));
		expect(screen.getByRole('button', { name: 'Gerar Pix' })).toBeEnabled();
		expect(mocks.start).not.toHaveBeenCalled();
	});
	it('explains a rejected payment and only offers retry guidance when eligible', async () => {
		mocks.sync.mockResolvedValue({
			data: {
				attemptId: 'attempt',
				status: 'rejected',
				amountInCents: 20000,
				method: 'pix',
				installments: 1,
				balanceInCents: 20000,
				retainPix: false,
				pix: null,
				remoteUnavailable: false,
				retryAfterSeconds: 15,
			},
		});
		const { rerender } = render(
			<OnlinePaymentCheckout {...props} option={{ ...props.option, attemptId: 'attempt' }} />,
		);
		fireEvent(window, new Event('focus'));
		expect(await screen.findByRole('alert')).toHaveTextContent('Pagamento recusado.');
		expect(screen.getByRole('alert')).toHaveTextContent('Nenhum pagamento foi registrado nesta tentativa.');
		expect(screen.getByRole('alert')).toHaveTextContent('Consulte a situação antes de iniciar outro pagamento.');
		expect(screen.queryByRole('button', { name: 'Tentar outro pagamento' })).not.toBeInTheDocument();
		rerender(<OnlinePaymentCheckout {...props} option={{ ...props.option, canStart: true }} />);
		expect(screen.getByRole('alert')).toHaveTextContent(
			'Você pode tentar novamente com outro cartão ou escolher outra forma de pagamento.',
		);
		expect(screen.getByRole('button', { name: 'Tentar outro pagamento' })).toBeEnabled();
		expect(mocks.start).not.toHaveBeenCalled();
	});
	it('does not present rejection guidance for an attempt in review', async () => {
		mocks.sync.mockResolvedValue({
			data: {
				attemptId: 'attempt',
				status: 'review',
				amountInCents: 20000,
				method: 'pix',
				installments: 1,
				balanceInCents: 20000,
				retainPix: false,
				pix: null,
				remoteUnavailable: false,
				retryAfterSeconds: 15,
			},
		});
		render(<OnlinePaymentCheckout {...props} option={{ ...props.option, attemptId: 'attempt' }} />);
		fireEvent(window, new Event('focus'));
		expect(await screen.findByRole('alert')).toHaveTextContent('Pagamento em análise');
		expect(screen.getByRole('alert')).toHaveTextContent('não realize outro pagamento neste momento');
		expect(screen.getByRole('alert')).toHaveTextContent('Entre em contato com a clínica');
		expect(screen.queryByText('Pagamento recusado.')).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Atualizar situação' })).not.toBeInTheDocument();
		expect(screen.queryByText(/Estamos acompanhando seu pagamento/)).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Tentar outro pagamento' })).not.toBeInTheDocument();
	});
	it('tracks an attempt newly returned by server refresh without offering creation', () => {
		const { rerender } = render(<OnlinePaymentCheckout {...props} />);
		rerender(<OnlinePaymentCheckout {...props} option={{ ...props.option, attemptId: 'attempt' }} />);
		expect(screen.getByText(/Estamos acompanhando seu pagamento/)).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Gerar Pix' })).not.toBeInTheDocument();
	});
	it('acompanha Pix automaticamente, preserva o código durante o cooldown e para na aprovação', async () => {
		vi.useFakeTimers();
		mocks.start.mockResolvedValue({
			data: { attemptId: 'attempt', snapshot: snapshot({ pix: { code: '000201TESTE', pngBase64: null } }) },
		});
		mocks.sync
			.mockResolvedValueOnce({ data: snapshot({ retainPix: true }) })
			.mockResolvedValueOnce({ data: snapshot({ status: 'approved', balanceInCents: 0 }) });
		render(<OnlinePaymentCheckout {...props} option={{ ...props.option, canStart: true }} />);
		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: 'Gerar Pix' }));
		});
		expect(screen.getByRole('textbox', { name: 'Código Pix' })).toHaveValue('000201TESTE');
		await tick(2999);
		expect(mocks.sync).not.toHaveBeenCalled();
		await tick(1);
		expect(mocks.sync).toHaveBeenCalledTimes(1);
		expect(screen.getByRole('textbox', { name: 'Código Pix' })).toHaveValue('000201TESTE');
		await tick(3000);
		expect(screen.getByText('Pagamento aprovado!')).toBeInTheDocument();
		expect(
			within(screen.getByRole('region', { name: 'Detalhes do pagamento' })).getByText('Pix', { exact: true }),
		).toBeInTheDocument();
		expect(screen.queryByRole('textbox', { name: 'Código Pix' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Atualizar situação' })).not.toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Voltar ao meu financeiro' })).toHaveAttribute(
			'href',
			props.returnHref,
		);
		await tick(60000);
		expect(mocks.sync).toHaveBeenCalledTimes(2);
	});
	it.each([1, 3])('exibe a aprovação do cartão com %i parcela(s) e saldo autoritativo', async (installments) => {
		vi.useFakeTimers();
		mocks.sync.mockResolvedValue({
			data: snapshot({ status: 'approved', method: 'credit_card', installments, balanceInCents: 5000 }),
		});
		render(<OnlinePaymentCheckout {...existing} />);
		await tick(3000);
		expect(screen.getByText('Pagamento aprovado!')).toBeInTheDocument();
		expect(screen.getByText('Cartão de crédito', { exact: true })).toBeInTheDocument();
		expect(screen.getByText(installments === 1 ? 'À vista' : '3x')).toBeInTheDocument();
		expect(screen.getByText(/R\$\s*50,00/)).toBeInTheDocument();
		expect(screen.getByText(/Ainda existe saldo em aberto/)).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Gerar Pix' })).not.toBeInTheDocument();
		expect(mocks.refresh).toHaveBeenCalledOnce();
		await tick(60000);
		expect(mocks.sync).toHaveBeenCalledOnce();
	});
	it('recupera falha de consulta automaticamente e oferece atualização manual apenas na falha', async () => {
		vi.useFakeTimers();
		mocks.sync.mockResolvedValueOnce({}).mockResolvedValueOnce({ data: snapshot({ status: 'pending' }) });
		render(<OnlinePaymentCheckout {...existing} />);
		expect(screen.queryByRole('button', { name: 'Atualizar situação' })).not.toBeInTheDocument();
		await tick(3000);
		expect(screen.getByText(/Estamos tentando novamente/)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Atualizar situação' })).toBeEnabled();
		await tick(3000);
		expect(screen.queryByRole('button', { name: 'Atualizar situação' })).not.toBeInTheDocument();
		expect(screen.getByText(/Estamos acompanhando seu pagamento/)).toBeInTheDocument();
		expect(mocks.start).not.toHaveBeenCalled();
	});
	it('remove o Pix da interface se a consulta autorizada falhar', async () => {
		vi.useFakeTimers();
		mocks.start.mockResolvedValue({
			data: { attemptId: 'attempt', snapshot: snapshot({ pix: { code: '000201TESTE', pngBase64: null } }) },
		});
		mocks.sync.mockRejectedValue(new Error('falha'));
		render(<OnlinePaymentCheckout {...props} option={{ ...props.option, canStart: true }} />);
		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: 'Gerar Pix' }));
		});
		expect(screen.getByRole('textbox', { name: 'Código Pix' })).toBeInTheDocument();
		await tick(3000);
		expect(screen.queryByRole('textbox', { name: 'Código Pix' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Gerar Pix' })).not.toBeInTheDocument();
	});
	it('não sobrepõe consultas e cancela o acompanhamento ao desmontar', async () => {
		vi.useFakeTimers();
		let resolve: (value: { data: OnlinePaymentSnapshot }) => void = () => {};
		mocks.sync.mockImplementation(
			() =>
				new Promise((done) => {
					resolve = done;
				}),
		);
		const { unmount } = render(<OnlinePaymentCheckout {...existing} />);
		await tick(3000);
		fireEvent(window, new Event('focus'));
		await tick(30000);
		expect(mocks.sync).toHaveBeenCalledOnce();
		unmount();
		await act(async () => resolve({ data: snapshot({ status: 'approved', balanceInCents: 0 }) }));
		await tick(60000);
		expect(mocks.sync).toHaveBeenCalledOnce();
		expect(mocks.refresh).not.toHaveBeenCalled();
	});
	it('pausa em aba oculta e retoma imediatamente ao voltar', async () => {
		vi.useFakeTimers();
		const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
		mocks.sync.mockResolvedValue({ data: snapshot() });
		render(<OnlinePaymentCheckout {...existing} />);
		await tick(30000);
		expect(mocks.sync).not.toHaveBeenCalled();
		visibility.mockReturnValue('visible');
		fireEvent(document, new Event('visibilitychange'));
		await tick(0);
		expect(mocks.sync).toHaveBeenCalledOnce();
	});
	it('aumenta o intervalo de consultas sem alterar o cooldown do provedor', async () => {
		vi.useFakeTimers();
		mocks.sync.mockResolvedValue({ data: snapshot() });
		render(<OnlinePaymentCheckout {...existing} />);
		await tick(15000);
		expect(mocks.sync).toHaveBeenCalledTimes(5);
		await tick(4999);
		expect(mocks.sync).toHaveBeenCalledTimes(5);
		await tick(1);
		expect(mocks.sync).toHaveBeenCalledTimes(6);
	});
	it.each(['rejected', 'expired', 'cancelled', 'review'])('encerra acompanhamento em %s', async (status) => {
		vi.useFakeTimers();
		mocks.sync.mockResolvedValue({ data: snapshot({ status }) });
		render(<OnlinePaymentCheckout {...existing} />);
		await tick(3000);
		await tick(60000);
		expect(mocks.sync).toHaveBeenCalledOnce();
		expect(screen.queryByText('Pagamento aprovado!')).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Atualizar situação' })).not.toBeInTheDocument();
	});
	it('apresenta aprovação Pix imediata sem começar outro acompanhamento', async () => {
		vi.useFakeTimers();
		mocks.start.mockResolvedValue({
			data: { attemptId: 'attempt', snapshot: snapshot({ status: 'approved', balanceInCents: 0 }) },
		});
		render(<OnlinePaymentCheckout {...props} option={{ ...props.option, canStart: true }} />);
		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: 'Gerar Pix' }));
		});
		expect(screen.getByText('Pagamento aprovado!')).toBeInTheDocument();
		await tick(60000);
		expect(mocks.sync).not.toHaveBeenCalled();
	});
	it('preserva a recusa quando a tentativa chegou pelas props e deixa de bloquear no servidor', async () => {
		vi.useFakeTimers();
		mocks.sync.mockResolvedValue({ data: snapshot({ status: 'rejected' }) });
		const { rerender } = render(<OnlinePaymentCheckout {...props} />);
		rerender(<OnlinePaymentCheckout {...existing} />);
		await tick(3000);
		rerender(<OnlinePaymentCheckout {...props} option={{ ...props.option, canStart: true }} />);
		expect(screen.getByText('Pagamento recusado.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Tentar outro pagamento' })).toBeEnabled();
	});
});

describe('layout exclusivo de confirmação', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
	});
	afterEach(() => {
		vi.useRealTimers();
	});
	it.each(['pix', 'credit_card'])('substitui o checkout completo após aprovação de %s', async (method) => {
		vi.useFakeTimers();
		mocks.sync
			.mockResolvedValueOnce({ data: snapshot({ status: 'pending' }) })
			.mockResolvedValueOnce({ data: snapshot({ status: 'approved', method, balanceInCents: 0 }) });
		render(
			<OnlinePaymentCheckout {...existing} summary={<section aria-label='Resumo da cobrança'>Resumo</section>} />,
		);
		expect(screen.getByRole('region', { name: 'Resumo da cobrança' })).toBeInTheDocument();
		await tick(3000);
		expect(screen.getByRole('region', { name: 'Resumo da cobrança' })).toBeInTheDocument();
		await tick(3000);
		expect(screen.queryByRole('region', { name: 'Resumo da cobrança' })).not.toBeInTheDocument();
		expect(screen.queryByRole('region', { name: 'Pagamento online' })).not.toBeInTheDocument();
		expect(screen.getByText('Confirmação de pagamento')).toBeInTheDocument();
		expect(screen.getByText('Principal creditado na cobrança')).toBeInTheDocument();
		expect(screen.getByText('Sua cobrança está quitada.')).toBeInTheDocument();
		expect(screen.getAllByRole('link', { name: 'Voltar ao meu financeiro' })).toHaveLength(1);
		await tick(60000);
		expect(mocks.sync).toHaveBeenCalledTimes(2);
	});
	it('mantém o layout de revisão e não oferece nova tentativa', async () => {
		vi.useFakeTimers();
		mocks.sync.mockResolvedValue({ data: snapshot({ status: 'review' }) });
		render(
			<OnlinePaymentCheckout {...existing} summary={<section aria-label='Resumo da cobrança'>Resumo</section>} />,
		);
		await tick(3000);
		expect(screen.getByRole('region', { name: 'Resumo da cobrança' })).toBeInTheDocument();
		expect(screen.getByRole('alert')).toHaveTextContent('Pagamento em análise');
		expect(screen.queryByText('Sua cobrança está quitada.')).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Tentar outro pagamento' })).not.toBeInTheDocument();
	});
	it('não afirma quitação em aprovação parcial', async () => {
		vi.useFakeTimers();
		mocks.sync.mockResolvedValue({ data: snapshot({ status: 'approved', balanceInCents: 5000 }) });
		render(
			<OnlinePaymentCheckout {...existing} summary={<section aria-label='Resumo da cobrança'>Resumo</section>} />,
		);
		await tick(3000);
		expect(screen.queryByRole('region', { name: 'Resumo da cobrança' })).not.toBeInTheDocument();
		expect(screen.queryByText('Sua cobrança está quitada.')).not.toBeInTheDocument();
		expect(screen.getByText(/Ainda existe saldo em aberto/)).toBeInTheDocument();
	});
	it('organiza valores e detalhes em regiões distintas na aprovação parcelada', async () => {
		vi.useFakeTimers();
		mocks.sync.mockResolvedValue({
			data: snapshot({ status: 'approved', method: 'credit_card', installments: 2, balanceInCents: 0 }),
		});
		render(
			<OnlinePaymentCheckout {...existing} summary={<section aria-label='Resumo da cobrança'>Resumo</section>} />,
		);
		await tick(3000);
		expect(screen.getByLabelText('Valores do pagamento')).toHaveTextContent('Saldo restante');
		expect(screen.getByRole('region', { name: 'Detalhes do pagamento' })).toHaveTextContent('2x');
		expect(screen.getByRole('region', { name: 'Detalhes do pagamento' })).toHaveTextContent(
			'Total pago nesta operação',
		);
		expect(screen.getByRole('link', { name: 'Voltar ao meu financeiro' })).toHaveAttribute(
			'href',
			props.returnHref,
		);
	});
});

describe('seleção de valor', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});
	it.each(['pix', 'credit_card'] as const)(
		'envia valor parcial por %s com saldo esperado integral',
		async (method) => {
			mocks.start.mockResolvedValue({ data: { attemptId: 'attempt', status: 'processing' } });
			render(<OnlinePaymentCheckout {...props} option={{ ...props.option, canStart: true }} />);
			fireEvent.click(screen.getByRole('radio', { name: 'Pagar outro valor' }));
			fireEvent.change(screen.getByLabelText('Valor desejado'), { target: { value: 'R$ 100,00' } });
			if (method === 'credit_card') {
				fireEvent.click(screen.getByRole('button', { name: /Cartão de crédito/ }));
				fireEvent.click(await screen.findByRole('button', { name: 'Enviar cartão de teste' }));
			} else fireEvent.click(screen.getByRole('button', { name: 'Gerar Pix' }));
			await waitFor(() =>
				expect(mocks.start).toHaveBeenCalledWith(
					expect.objectContaining({ method, expectedBalanceInCents: 20000, amountInCents: 10000 }),
				),
			);
			expect(screen.queryByRole('radio', { name: 'Pagar outro valor' })).not.toBeInTheDocument();
		},
	);
	it('bloqueia valor acima do saldo', () => {
		render(<OnlinePaymentCheckout {...props} option={{ ...props.option, canStart: true }} />);
		fireEvent.click(screen.getByRole('radio', { name: 'Pagar outro valor' }));
		fireEvent.change(screen.getByLabelText('Valor desejado'), { target: { value: 'R$ 201,00' } });
		expect(screen.getByRole('button', { name: 'Gerar Pix' })).toBeDisabled();
		expect(mocks.start).not.toHaveBeenCalled();
	});
});

it('exibe demonstrativo autorizado e permite continuar apenas após atualização do saldo', async () => {
	vi.useFakeTimers();
	mocks.sync.mockResolvedValue({
		data: snapshot({
			status: 'approved',
			amountInCents: 10000,
			balanceInCents: 10000,
			confirmation: {
				totalInCents: 20000,
				paidInCents: 10000,
				providerPaidAmountInCents: 10000,
				receipts: [
					{
						amountInCents: 10000,
						method: 'pix',
						current: true,
						ownOnline: true,
						providerPaidAmountInCents: 10000,
						installments: 1,
					},
				],
			},
		}),
	});
	const { rerender } = render(
		<OnlinePaymentCheckout
			{...existing}
			items={[
				{
					chargeId: 'charge',
					id: 'service',
					kind: 'service',
					name: 'Perfil Básico',
					quantity: 1,
					unitPriceInCents: 20000,
					discountInCents: 0,
				},
			]}
		/>,
	);
	await tick(3000);
	expect(screen.getByText('Perfil Básico')).toBeInTheDocument();
	expect(screen.getByText('50% pago')).toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Pagar saldo restante' })).not.toBeInTheDocument();
	rerender(<OnlinePaymentCheckout {...props} balanceInCents={10000} option={{ ...props.option, canStart: true }} />);
	fireEvent.click(screen.getByRole('button', { name: 'Pagar saldo restante' }));
	expect(screen.getByRole('button', { name: 'Gerar Pix' })).toBeEnabled();
	vi.useRealTimers();
});

it('permite editar o valor parcial a partir de um campo vazio, inclusive centavos e exclusão', () => {
	render(<OnlinePaymentCheckout {...props} option={{ ...props.option, canStart: true }} />);
	fireEvent.click(screen.getByRole('radio', { name: 'Pagar outro valor' }));
	const input = screen.getByLabelText('Valor desejado');
	const pix = screen.getByRole('button', { name: 'Gerar Pix' });
	expect(input).toHaveValue('');
	expect(pix).toBeDisabled();
	for (const value of ['R$ 5', 'R$ 50', 'R$ 50,', 'R$ 50,5', 'R$ 50,50']) {
		fireEvent.change(input, { target: { value } });
		expect(input).toHaveValue(value);
		expect(pix).toBeEnabled();
	}
	fireEvent.change(input, { target: { value: '' } });
	expect(input).toHaveValue('');
	expect(pix).toBeDisabled();
	fireEvent.change(input, { target: { value: 'R$ 0,01' } });
	expect(input).toHaveValue('R$ 0,01');
	expect(pix).toBeEnabled();
	expect(mocks.start).not.toHaveBeenCalled();
});

it('preserva o demonstrativo quitado com desembolso acumulado desconhecido no novo layout', () => {
	const payment = snapshot({
		status: 'approved',
		amountInCents: 12000,
		balanceInCents: 0,
		confirmation: {
			totalInCents: 20000,
			paidInCents: 20000,
			providerPaidAmountInCents: 12000,
			receipts: [
				{
					amountInCents: 8000,
					method: 'credit_card',
					current: false,
					ownOnline: true,
					providerPaidAmountInCents: null,
					installments: 2,
				},
				{
					amountInCents: 12000,
					method: 'pix',
					current: true,
					ownOnline: true,
					providerPaidAmountInCents: 12000,
					installments: 1,
				},
			],
		},
	});
	render(
		<OnlinePaymentSuccess
			payment={payment}
			petName='Teste'
			returnHref={props.returnHref}
			testMode
			onContinue={vi.fn()}
		/>,
	);
	expect(screen.getByRole('status')).toHaveTextContent('Pagamento aprovado!');
	expect(screen.getByRole('progressbar')).toHaveAttribute('value', '100');
	expect(screen.getByText('Indisponível')).toBeInTheDocument();
	expect(screen.getByRole('region', { name: 'Histórico de pagamentos da cobrança' })).toHaveTextContent(
		'Cartão de crédito · 2x',
	);
	expect(screen.queryByText('Acréscimos dos seus pagamentos online')).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Pagar saldo restante' })).not.toBeInTheDocument();
});

it('mantém ação de continuidade autorizada e progresso parcial no novo layout', () => {
	const onContinue = vi.fn();
	const payment = snapshot({
		status: 'approved',
		amountInCents: 8000,
		method: 'credit_card',
		installments: 2,
		balanceInCents: 12000,
		confirmation: {
			totalInCents: 20000,
			paidInCents: 8000,
			providerPaidAmountInCents: null,
			receipts: [
				{
					amountInCents: 8000,
					method: 'credit_card',
					current: true,
					ownOnline: true,
					providerPaidAmountInCents: null,
					installments: 2,
				},
			],
		},
	});
	render(
		<OnlinePaymentSuccess
			payment={payment}
			petName='Teste'
			returnHref={props.returnHref}
			onContinue={onContinue}
		/>,
	);
	expect(screen.getByRole('progressbar')).toHaveAttribute('value', '40');
	expect(screen.getByText('Não informado')).toBeInTheDocument();
	expect(screen.queryByText('Sua cobrança está quitada.')).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole('button', { name: 'Pagar saldo restante' }));
	expect(onContinue).toHaveBeenCalledTimes(1);
});

it('exibe desembolso próprio confirmado sem expor acréscimos de outro tutor', () => {
	const payment = snapshot({
		status: 'approved',
		amountInCents: 12000,
		balanceInCents: 0,
		confirmation: {
			totalInCents: 20000,
			paidInCents: 20000,
			providerPaidAmountInCents: 12000,
			receipts: [
				{
					amountInCents: 8000,
					method: 'credit_card',
					current: false,
					ownOnline: true,
					providerPaidAmountInCents: 8772,
					installments: 2,
				},
				{
					amountInCents: 12000,
					method: 'pix',
					current: true,
					ownOnline: true,
					providerPaidAmountInCents: 12000,
					installments: 1,
				},
			],
		},
	});
	const { rerender } = render(
		<OnlinePaymentSuccess payment={payment} petName='Teste' returnHref={props.returnHref} />,
	);
	const history = screen.getByRole('region', { name: 'Histórico de pagamentos da cobrança' });
	expect(history).toHaveTextContent(/207,72/);
	expect(history).toHaveTextContent('Cartão de crédito · 2x de R$ 43,86');
	expect(history).toHaveTextContent(/Total pago:.*87,72/);
	expect(history).toHaveTextContent(/Acréscimos:.*7,72/);
	const confirmation = payment.confirmation!;
	rerender(
		<OnlinePaymentSuccess
			payment={{
				...payment,
				confirmation: {
					...confirmation,
					receipts: confirmation.receipts.map((receipt) =>
						receipt.method === 'credit_card' ? { ...receipt, ownOnline: false } : receipt,
					),
				},
			}}
			petName='Teste'
			returnHref={props.returnHref}
		/>,
	);
	expect(history).not.toHaveTextContent(/87,72|207,72|7,72|43,86/);
});

it.each([
	[8772, '2x de R$ 43,86'],
	[8771, '2x de aproximadamente R$ 43,86'],
	[null, '2x'],
] as const)('exibe parcelamento próprio com total %s nos detalhes e histórico', (total, expected) => {
	const payment = snapshot({
		status: 'approved',
		amountInCents: 8000,
		method: 'credit_card',
		installments: 2,
		balanceInCents: 12000,
		confirmation: {
			totalInCents: 20000,
			paidInCents: 8000,
			providerPaidAmountInCents: total,
			receipts: [
				{
					amountInCents: 8000,
					method: 'credit_card',
					current: true,
					ownOnline: true,
					providerPaidAmountInCents: total,
					installments: 2,
				},
			],
		},
	});
	render(<OnlinePaymentSuccess payment={payment} petName='Teste' returnHref={props.returnHref} />);
	expect(screen.getByRole('region', { name: 'Detalhes do pagamento' })).toHaveTextContent(`Parcelamento${expected}`);
	expect(screen.getByRole('region', { name: 'Histórico de pagamentos da cobrança' })).toHaveTextContent(
		`Cartão de crédito · ${expected}`,
	);
});

it('destaca o desembolso sem confundir principal e saldo no cabeçalho compacto', () => {
	const payment = snapshot({
		status: 'approved',
		amountInCents: 8000,
		method: 'credit_card',
		installments: 2,
		balanceInCents: 12000,
		confirmation: { totalInCents: 20000, paidInCents: 8000, providerPaidAmountInCents: 8772, receipts: [] },
	});
	render(<OnlinePaymentSuccess payment={payment} petName='Teste' returnHref={props.returnHref} />);
	const header = screen.getByRole('region', { name: 'Confirmação do pagamento' });
	expect(header).toHaveTextContent(/Valor total pago.*87,72/);
	expect(header).toHaveTextContent(/Principal creditado na cobrança.*80,00/);
	expect(header).toHaveTextContent(/Saldo restante da cobrança.*120,00/);
	expect(header).toHaveTextContent('2x de R$ 43,86');
	expect(screen.getByRole('progressbar')).toHaveAttribute('value', '40');
});

it('não apresenta o principal como desembolso quando o total remoto é desconhecido', () => {
	const payment = snapshot({
		status: 'approved',
		amountInCents: 8000,
		method: 'credit_card',
		installments: 2,
		balanceInCents: 12000,
	});
	render(<OnlinePaymentSuccess payment={payment} petName='Teste' returnHref={props.returnHref} />);
	expect(screen.getByLabelText('Valores do pagamento')).toHaveTextContent('Indisponível no momento');
	expect(screen.getByRole('region', { name: 'Confirmação do pagamento' })).toHaveTextContent(
		/Principal creditado na cobrança.*80,00/,
	);
});

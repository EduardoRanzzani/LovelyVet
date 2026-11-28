import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PaymentConfirmation, PaymentReceiptView } from '@/lib/finance/online-payment-view';
import { PaymentProgressBar } from './payment-progress-bar';

const receipt = (
	method: string,
	amountInCents: number,
	ownOnline = true,
	providerPaidAmountInCents: number | null = null,
): PaymentReceiptView => ({
	method,
	amountInCents,
	ownOnline,
	providerPaidAmountInCents,
	current: false,
	installments: null,
});
const show = (paidInCents: number, receipts: PaymentReceiptView[], totalInCents = 20000) =>
	render(
		<PaymentProgressBar
			confirmation={
				{ totalInCents, paidInCents, receipts } satisfies Pick<
					PaymentConfirmation,
					'totalInCents' | 'paidInCents' | 'receipts'
				>
			}
		/>,
	);
const legend = () => screen.getByRole('list', { name: 'Composição dos pagamentos' });

describe('PaymentProgressBar', () => {
	it('segmenta cartão e Pix pelo principal confirmado, sem divulgar acréscimos', () => {
		show(14000, [receipt('pix', 6000), receipt('credit_card', 8000, false, 8772)]);
		expect(screen.getByRole('progressbar')).toHaveAttribute('value', '70');
		const entries = within(legend()).getAllByRole('listitem');
		expect(entries[0]).toHaveTextContent(/Cartão de crédito.*80,00/);
		expect(entries[1]).toHaveTextContent(/Pix.*60,00/);
		expect(entries[2]).toHaveTextContent(/Em aberto.*60,00/);
		expect(legend()).not.toHaveTextContent(/87,72|7,72/);
	});
	it('agrupa recebimentos manuais e online do mesmo método', () => {
		show(10000, [receipt('pix', 3000, false), receipt('pix', 7000)]);
		expect(within(legend()).getAllByRole('listitem')).toHaveLength(2);
		expect(legend()).toHaveTextContent(/Pix.*100,00/);
	});
	it('omite o saldo em aberto quando quitado', () => {
		show(20000, [receipt('cash', 20000, false)]);
		expect(screen.getByRole('progressbar')).toHaveAttribute('value', '100');
		expect(legend()).not.toHaveTextContent('Em aberto');
	});
	it('agrupa transferência e outros métodos não classificados', () => {
		show(5000, [receipt('transfer', 2000), receipt('other', 3000)]);
		expect(legend()).toHaveTextContent(/Outros métodos.*50,00/);
	});
	it('não inventa composição quando o histórico está incompleto', () => {
		show(8000, []);
		expect(screen.getByRole('progressbar')).toHaveAttribute('value', '40');
		expect(screen.queryByRole('list', { name: 'Composição dos pagamentos' })).not.toBeInTheDocument();
	});
	it('limita o progresso quando há recebimentos acima do total', () => {
		show(21000, [receipt('pix', 21000)]);
		expect(screen.getByRole('progressbar')).toHaveAttribute('value', '100');
		expect(screen.queryByRole('list', { name: 'Composição dos pagamentos' })).not.toBeInTheDocument();
	});
	it('não divide por zero', () => {
		show(0, [], 0);
		expect(screen.getByRole('progressbar')).toHaveAttribute('value', '0');
	});
	it('exibe somente saldo em aberto quando não há recebimentos', () => {
		show(0, []);
		expect(within(legend()).getAllByRole('listitem')).toHaveLength(1);
		expect(legend()).toHaveTextContent(/Em aberto.*200,00/);
	});
});

import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PaymentPage from './page';

const mocks = vi.hoisted(() => ({
	access: vi.fn(),
	charge: vi.fn(),
	items: vi.fn(),
	options: vi.fn(),
	notFound: vi.fn(() => {
		throw new Error('NOT_FOUND');
	}),
}));
vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));
vi.mock('@/lib/security/authorization', () => ({ requirePageAccess: mocks.access }));
vi.mock('@/lib/finance/financial-report-queries', () => ({ getOwnFinancialCharge: mocks.charge }));
vi.mock('@/lib/finance/customer-statement-queries', () => ({ getOwnStatementItems: mocks.items }));
vi.mock('@/lib/finance/online-payment-options', () => ({ getOwnOnlinePaymentOptions: mocks.options }));
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
vi.mock('../../_components/online-payment-checkout', () => ({
	OnlinePaymentCheckout: () => <div>Checkout disponível</div>,
}));

const id = 'c943e3cd-d2bb-4c19-a386-5a8e56899128';
const context = { role: 'customer', customerId: 'customer-a', userId: 'user-a' };
const charge = {
	id,
	petName: 'Teste',
	status: 'open',
	financialStatus: 'pending',
	totalInCents: 20000,
	paidInCents: 0,
	balanceInCents: 20000,
};
const load = (chargeId = id) =>
	PaymentPage({
		params: Promise.resolve({ chargeId }),
		searchParams: Promise.resolve({ month: '2026-11', scope: 'all' }),
	});

describe('PaymentPage', () => {
	beforeEach(() => {
		mocks.access.mockResolvedValue(context);
		mocks.charge.mockResolvedValue(charge);
		mocks.items.mockResolvedValue(new Map());
		mocks.options.mockResolvedValue(new Map([[id, { canStart: false, attemptId: null, testMode: true }]]));
	});
	it('renders the scoped charge and keeps the return filters', async () => {
		render(await load());
		expect(mocks.access).toHaveBeenCalledWith('/my-finance');
		expect(mocks.charge).toHaveBeenCalledWith('2026-11', id);
		expect(mocks.items).toHaveBeenCalledWith([id]);
		expect(mocks.options).toHaveBeenCalledWith(context, [charge]);
		expect(screen.getByText('Checkout disponível')).toBeInTheDocument();
		expect(screen.getByText('Teste')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Voltar ao meu financeiro' })).toHaveAttribute(
			'href',
			'/my-finance?month=2026-11&scope=all',
		);
	});
	it('uses the available content width and preserves the responsive columns', async () => {
		render(await load());
		const payment = screen.getByRole('region', { name: 'Pagamento online' });
		const summary = screen.getByRole('region', { name: 'Resumo da cobrança' });
		const grid = payment.parentElement;
		const wrapper = grid?.parentElement;
		expect(wrapper).toHaveClass('w-full', 'min-w-0');
		expect(wrapper?.className).not.toMatch(/(?:^|\s)(?:mx-auto|max-w-\S+)(?:\s|$)/);
		expect(grid).toHaveClass('grid', 'lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]');
		expect(summary.parentElement).toBe(grid);
		expect(summary).toHaveClass('lg:col-start-2', 'lg:row-start-1');
		expect(payment).toHaveClass('lg:col-start-1', 'lg:row-start-1');
		expect(grid?.firstElementChild).toBe(summary);
	});
	it('returns not found for an unknown or unauthorized charge without loading details', async () => {
		mocks.charge.mockResolvedValue(null);
		await expect(load()).rejects.toThrow('NOT_FOUND');
		expect(mocks.items).not.toHaveBeenCalled();
		expect(mocks.options).not.toHaveBeenCalled();
	});
	it('rejects an invalid charge ID before querying', async () => {
		await expect(load('invalid')).rejects.toThrow('NOT_FOUND');
		expect(mocks.charge).not.toHaveBeenCalled();
	});
	it.each(['admin', 'doctor'])('rejects a %s even if the page guard returns it', async (role) => {
		mocks.access.mockResolvedValue({ ...context, role });
		await expect(load()).rejects.toThrow('NOT_FOUND');
		expect(mocks.charge).not.toHaveBeenCalled();
	});
	it('rejects a customer without a tutor record', async () => {
		mocks.access.mockResolvedValue({ ...context, customerId: null });
		await expect(load()).rejects.toThrow('NOT_FOUND');
		expect(mocks.charge).not.toHaveBeenCalled();
	});
	it('does not mount the payment form for a paid charge without an active option', async () => {
		mocks.charge.mockResolvedValue({ ...charge, financialStatus: 'paid', paidInCents: 20000, balanceInCents: 0 });
		mocks.options.mockResolvedValue(new Map());
		render(await load());
		expect(screen.getByText('Cobrança quitada.')).toBeInTheDocument();
		expect(screen.queryByText('Checkout disponível')).not.toBeInTheDocument();
	});
});

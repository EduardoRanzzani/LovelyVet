import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PaymentReceiptPage from './page';
const mocks = vi.hoisted(() => ({
	access: vi.fn(),
	charge: vi.fn(),
	receipt: vi.fn(),
	items: vi.fn(),
	notFound: vi.fn(() => {
		throw new Error('NOT_FOUND');
	}),
}));
vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));
vi.mock('@/lib/security/authorization', () => ({ requirePageAccess: mocks.access }));
vi.mock('@/lib/finance/financial-report-queries', () => ({ getOwnFinancialCharge: mocks.charge }));
vi.mock('@/lib/finance/customer-statement-queries', () => ({ getOwnStatementItems: mocks.items }));
vi.mock('@/lib/finance/online-payment-receipts', () => ({ getOwnOnlineReceipt: mocks.receipt }));
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
const chargeId = 'e27c324b-dd43-48d1-a3f3-f42b1f8d90b7';
const attemptId = '66989a2e-b26b-4283-94c9-eda4a7a30d7d';
const context = { role: 'customer', customerId: 'customer-a', userId: 'user-a' };
const load = (id = attemptId) =>
	PaymentReceiptPage({
		params: Promise.resolve({ chargeId, attemptId: id }),
		searchParams: Promise.resolve({ month: '2026-11', scope: 'all' }),
	});
beforeEach(() => {
	vi.resetAllMocks();
	mocks.access.mockResolvedValue(context);
	mocks.charge.mockResolvedValue({ id: chargeId, petName: 'Teste' });
	mocks.items.mockResolvedValue(new Map());
	mocks.receipt.mockResolvedValue({
		testMode: true,
		receivedAt: new Date('2026-11-27T14:13:54Z'),
		payment: {
			attemptId,
			status: 'approved',
			amountInCents: 8000,
			method: 'credit_card',
			installments: 2,
			balanceInCents: 12000,
			confirmation: {
				totalInCents: 20000,
				paidInCents: 8000,
				providerPaidAmountInCents: 8772,
				receipts: [
					{
						amountInCents: 8000,
						method: 'credit_card',
						current: true,
						ownOnline: true,
						installments: 2,
						providerPaidAmountInCents: 8772,
					},
				],
			},
		},
	});
});
describe('PaymentReceiptPage', () => {
	it('reabre comprovante parcial sem checkout e preserva filtros', async () => {
		render(await load());
		expect(mocks.receipt).toHaveBeenCalledWith(context, chargeId, attemptId);
		expect(screen.getByText('Pagamento deste comprovante')).toBeInTheDocument();
		expect(screen.getByRole('status')).toHaveTextContent(/Recebimento confirmado em/);
		expect(screen.getByRole('region', { name: 'Confirmação do pagamento' })).toHaveTextContent(
			'O resumo e o saldo da cobrança refletem a situação atual.',
		);
		expect(screen.getByText(/Parcelamento/, { selector: 'dt' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Voltar ao meu financeiro' })).toHaveAttribute(
			'href',
			'/my-finance?month=2026-11&scope=all',
		);
		expect(screen.queryByRole('button', { name: 'Pagar saldo restante' })).not.toBeInTheDocument();
	});
	it('rejeita identificador inválido antes de consultar', async () => {
		await expect(load('invalid')).rejects.toThrow('NOT_FOUND');
		expect(mocks.charge).not.toHaveBeenCalled();
	});
	it('rejeita cobrança sem vínculo', async () => {
		mocks.charge.mockResolvedValue(null);
		await expect(load()).rejects.toThrow('NOT_FOUND');
		expect(mocks.receipt).not.toHaveBeenCalled();
	});
	it('rejeita tentativa não autorizada ou sem recebimento', async () => {
		mocks.receipt.mockResolvedValue(null);
		await expect(load()).rejects.toThrow('NOT_FOUND');
		expect(mocks.items).not.toHaveBeenCalled();
	});
	it('rejeita perfil sem tutor', async () => {
		mocks.access.mockResolvedValue({ role: 'customer', customerId: null });
		await expect(load()).rejects.toThrow('NOT_FOUND');
		expect(mocks.charge).not.toHaveBeenCalled();
	});
});

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StaffOnlinePaymentHistory } from './staff-online-payment-history';
import type { StaffOnlinePaymentAttempt } from '@/lib/finance/staff-online-payment';

const mocks = vi.hoisted(() => ({ execute: vi.fn(), refresh: vi.fn() }));
vi.mock('@/api/actions/online-payment.actions', () => ({ syncStaffOnlinePayment: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock('next-safe-action/hooks', () => ({
	useAction: () => ({ execute: mocks.execute, isPending: false }),
}));
const attempt: StaffOnlinePaymentAttempt = {
	id: 'a',
	chargeId: 'c',
	amountInCents: 20000,
	method: 'pix',
	installments: 1,
	status: 'pending',
	createdAt: '2026-11-25T12:00:00Z',
	updatedAt: '2026-11-25T12:01:00Z',
	expiresAt: '2026-11-26T12:00:00Z',
	reconciliationReason: null,
};

describe('histórico online para equipe', () => {
	it('não mostra seção quando não há tentativas', () => {
		const { container } = render(<StaffOnlinePaymentHistory attempts={[]} />);
		expect(container).toBeEmptyDOMElement();
	});
	it('diferencia tentativa de recebimento e exibe método, valor e expiração', () => {
		render(<StaffOnlinePaymentHistory attempts={[attempt]} />);
		const section = screen.getByRole('region', { name: 'Tentativas de pagamento online' });
		expect(within(section).getByText('Pendente')).toBeInTheDocument();
		expect(within(section).getByText('Pix')).toBeInTheDocument();
		expect(within(section).getByText(/R\$\s*200,00/)).toBeInTheDocument();
		expect(within(section).getByText(/não são recebimentos/)).toBeInTheDocument();
		expect(within(section).getByText(/Expiração prevista/)).toBeInTheDocument();
		fireEvent.click(within(section).getByRole('button', { name: 'Sincronizar' }));
		expect(mocks.execute).toHaveBeenCalledWith({ attemptId: 'a' });
	});
	it('sinaliza aprovação tardia e exige revisão humana, sem botão de baixa', () => {
		render(
			<StaffOnlinePaymentHistory
				attempts={[{ ...attempt, status: 'review', reconciliationReason: 'late_approval' }]}
			/>,
		);
		expect(screen.getByText('Revisão financeira')).toBeInTheDocument();
		expect(screen.getByRole('alert')).toHaveTextContent('Aprovação tardia');
		expect(screen.queryByRole('button', { name: 'Sincronizar' })).not.toBeInTheDocument();
	});
	it('mostra parcelamento sem incluir QR Code, dados pessoais ou IDs externos', () => {
		render(
			<StaffOnlinePaymentHistory
				attempts={[{ ...attempt, method: 'credit_card', installments: 3, status: 'approved' }]}
				compact
			/>,
		);
		expect(screen.getByText('Cartão de crédito · 3 parcelas')).toBeInTheDocument();
		expect(screen.getByText('Aprovada')).toBeInTheDocument();
		expect(screen.queryByText(/Última atualização/)).not.toBeInTheDocument();
		expect(screen.queryByText('a')).not.toBeInTheDocument();
	});
});

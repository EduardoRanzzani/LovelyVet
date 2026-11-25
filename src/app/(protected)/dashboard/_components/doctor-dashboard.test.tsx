import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import DoctorDashboard from './doctor-dashboard';

vi.mock('../../finance/_components/finance-month-filter', () => ({
	FinanceMonthFilter: () => <div>Mês de referência</div>,
}));

const data: ComponentProps<typeof DoctorDashboard>['data'] = {
	month: '2026-11',
	today: '2026-11-24',
	shifts: {
		total: 2,
		completedCount: 1,
		upcomingCount: 1,
		inProgressCount: 0,
		receivedInCents: 0,
		receivableInCents: 30000,
		forecastInCents: 25000,
		prepaidInCents: 0,
		missingAmountCount: 0,
		upcomingShifts: [],
	},
	nextShifts: [
		{
			id: 'shift',
			clinicName: 'Clínica A',
			startTime: new Date('2026-12-01T12:00:00Z'),
			endTime: new Date('2026-12-01T20:00:00Z'),
			amountInCents: 25000,
			isPaid: false,
		},
	],
	appointments: { total: 1, completed: 0, pending: 1, confirmed: 0, inProgress: 0, cancelled: 0, noShow: 0 },
	routine: { today: [], upcoming: [], completed: 0, confirmed: 0, pending: 0, inProgress: 0 },
	pendingConfirmations: 1,
	reminders: { overdue: 0, upcoming: 0, items: [] },
};

describe('DoctorDashboard', () => {
	it('prioriza plantões antes da agenda e dos indicadores mensais', () => {
		render(<DoctorDashboard data={data} />);
		const shifts = screen.getByRole('region', { name: 'Plantões' });
		const agenda = screen.getByRole('region', { name: 'Agenda de hoje' });
		const monthly = screen.getByRole('region', { name: 'Indicadores mensais' });
		expect(shifts.compareDocumentPosition(agenda) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(agenda.compareDocumentPosition(monthly) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});
	it('oculta os valores dos plantões, inclusive na lista de próximos compromissos', () => {
		render(<DoctorDashboard data={data} />);
		const shifts = screen.getByRole('region', { name: 'Plantões' });
		expect(within(shifts).getAllByText('••••')).toHaveLength(4);
		fireEvent.click(within(shifts).getByRole('button', { name: 'Mostrar valores' }));
		expect(within(shifts).queryByText('••••')).not.toBeInTheDocument();
		expect(within(shifts).getByRole('button', { name: 'Ocultar valores' })).toBeInTheDocument();
	});
	it('exibe os estados vazios da rotina sem esconder os plantões futuros', () => {
		render(<DoctorDashboard data={data} />);
		expect(screen.getByText('Nenhum atendimento agendado para hoje.')).toBeInTheDocument();
		expect(screen.getByText('Nenhum atendimento futuro nesse período.')).toBeInTheDocument();
		expect(screen.getByText('Nenhum retorno de vacinação pendente nesse período.')).toBeInTheDocument();
		expect(screen.getByText('Clínica A')).toBeInTheDocument();
	});
});

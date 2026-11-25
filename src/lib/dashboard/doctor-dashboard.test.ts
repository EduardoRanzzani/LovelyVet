import { describe, expect, it } from 'vitest';
import type { AuthContext } from '@/lib/security/auth-context';
import {
	appointmentCountLabel,
	getDoctorDashboardScope,
	getDoctorDashboardWindow,
	reminderCountLabel,
	shiftCountLabel,
	summarizeDoctorReminders,
	summarizeDoctorRoutine,
} from './doctor-dashboard';

const now = new Date('2026-11-25T02:00:00Z'); // 24/11, 22h em Campo Grande
const context: AuthContext = {
	role: 'doctor',
	userId: 'user-a',
	clerkUserId: 'clerk-a',
	doctorId: 'doctor-a',
	customerId: null,
};
const appointment = (id: string, scheduledAt: string, status = 'confirmed') => ({
	id,
	scheduledAt: new Date(scheduledAt),
	status,
});

describe('Dashboard Doctor', () => {
	it('deriva o escopo do profissional autenticado', () => {
		expect(getDoctorDashboardScope(context)).toBe('doctor-a');
	});
	it.each(['admin', 'customer'] as const)('rejeita o perfil %s', (role) => {
		expect(() => getDoctorDashboardScope({ ...context, role })).toThrow('não autorizado');
	});
	it('rejeita veterinário sem cadastro profissional', () => {
		expect(() => getDoctorDashboardScope({ ...context, doctorId: null })).toThrow('não autorizado');
	});
	it('usa os limites do dia local e atravessa a virada do mês', () => {
		const window = getDoctorDashboardWindow(now);
		expect(window.today).toBe('2026-11-24');
		expect(window.start.toISOString()).toBe('2026-11-24T04:00:00.000Z');
		expect(window.tomorrow.toISOString()).toBe('2026-11-25T04:00:00.000Z');
		expect(window.endDate).toBe('2026-12-24');
	});
	it('mantém a rotina em ordem cronológica e não inclui cancelados no futuro', () => {
		const data = summarizeDoctorRoutine(
			[
				appointment('future-december', '2026-12-01T12:00:00Z'),
				appointment('today-confirmed', '2026-11-25T03:59:59Z'),
				appointment('today-completed', '2026-11-24T12:00:00Z', 'completed'),
				appointment('today-pending', '2026-11-24T18:00:00Z', 'pending'),
				appointment('tomorrow', '2026-11-25T04:00:00Z', 'pending'),
				appointment('cancelled', '2026-11-27T12:00:00Z', 'cancelled'),
				appointment('outside', '2026-12-24T04:00:00Z'),
				appointment('yesterday', '2026-11-24T03:59:59Z'),
			],
			now,
		);
		expect(data.today.map((item) => item.id)).toEqual(['today-completed', 'today-pending', 'today-confirmed']);
		expect(data.upcoming.map((item) => item.id)).toEqual(['tomorrow', 'future-december']);
		expect(data.completed).toBe(1);
		expect(data.pending).toBe(1);
		expect(data.confirmed).toBe(1);
	});
	it('diferencia retornos vencidos, de hoje e futuros, excluindo o limite final', () => {
		const result = summarizeDoctorReminders(
			[
				{ dueDate: '2026-12-24' },
				{ dueDate: '2026-11-24' },
				{ dueDate: '2026-11-01' },
				{ dueDate: '2026-12-01' },
			],
			now,
		);
		expect(result.overdue).toBe(1);
		expect(result.upcoming).toBe(2);
		expect(result.items.map((item) => item.dueDate)).toEqual(['2026-11-01', '2026-11-24', '2026-12-01']);
	});
	it('limita a lista de retornos sem alterar a contagem', () => {
		const result = summarizeDoctorReminders(
			Array.from({ length: 7 }, () => ({ dueDate: '2026-11-23' })),
			now,
		);
		expect(result.overdue).toBe(7);
		expect(result.items).toHaveLength(5);
	});
	it('trata listas vazias', () => {
		expect(summarizeDoctorRoutine([], now).today).toEqual([]);
		expect(summarizeDoctorReminders([], now)).toEqual({ overdue: 0, upcoming: 0, items: [] });
	});
	it.each([
		[0, '0 plantões', '0 atendimentos', '0 retornos'],
		[1, '1 plantão', '1 atendimento', '1 retorno'],
		[14, '14 plantões', '14 atendimentos', '14 retornos'],
	] as const)('pluraliza corretamente a quantidade %s', (count, shifts, appointments, reminders) => {
		expect(shiftCountLabel(count)).toBe(shifts);
		expect(appointmentCountLabel(count)).toBe(appointments);
		expect(reminderCountLabel(count)).toBe(reminders);
	});
});

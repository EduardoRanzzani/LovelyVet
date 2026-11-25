import type { AuthContext } from '@/lib/security/auth-context';

export function getDoctorDashboardScope(context: AuthContext): string {
	if (context.role !== 'doctor' || !context.doctorId) {
		throw new Error('Perfil de veterinário não autorizado.');
	}
	return context.doctorId;
}

// O calendário operacional segue o fuso adotado pelo financeiro: Campo Grande (UTC-4).
export function getDoctorDashboardWindow(now: Date) {
	const day = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'America/Campo_Grande',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(now);
	const part = (type: string) => Number(day.find((item) => item.type === type)?.value);
	const year = part('year'),
		month = part('month'),
		date = part('day');
	const start = new Date(Date.UTC(year, month - 1, date, 4));
	const tomorrow = new Date(Date.UTC(year, month - 1, date + 1, 4));
	const end = new Date(Date.UTC(year, month - 1, date + 30, 4));
	return { start, tomorrow, end, today: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}

type Appointment = { scheduledAt: Date; status: string };
export function summarizeDoctorRoutine<T extends Appointment>(appointments: readonly T[], now: Date) {
	const { start, tomorrow, end } = getDoctorDashboardWindow(now);
	const ordered = [...appointments].sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
	const today = ordered.filter((a) => a.scheduledAt >= start && a.scheduledAt < tomorrow);
	const upcoming = ordered.filter(
		(a) => a.scheduledAt >= tomorrow && a.scheduledAt < end && (a.status === 'pending' || a.status === 'confirmed'),
	);
	return {
		today,
		upcoming,
		completed: today.filter((a) => a.status === 'completed').length,
		confirmed: today.filter((a) => a.status === 'confirmed').length,
		pending: today.filter((a) => a.status === 'pending').length,
		inProgress: today.filter((a) => a.status === 'in_progress').length,
	};
}

export function summarizeDoctorReminders<T extends { dueDate: string }>(reminders: readonly T[], now: Date) {
	const { today, endDate } = getDoctorDashboardWindow(now);
	const ordered = [...reminders]
		.filter((r) => r.dueDate < endDate)
		.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
	return {
		overdue: ordered.filter((r) => r.dueDate < today).length,
		upcoming: ordered.filter((r) => r.dueDate >= today).length,
		items: ordered.slice(0, 5),
	};
}

export const shiftCountLabel = (count: number) => `${count} ${count === 1 ? 'plantão' : 'plantões'}`;
export const appointmentCountLabel = (count: number) => `${count} ${count === 1 ? 'atendimento' : 'atendimentos'}`;
export const reminderCountLabel = (count: number) => `${count} ${count === 1 ? 'retorno' : 'retornos'}`;

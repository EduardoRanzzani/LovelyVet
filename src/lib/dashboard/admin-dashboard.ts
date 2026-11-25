import { getMonthBounds, buildFinancialReport, type FinancialStatementRow } from '@/lib/finance/financial-report';

export type DashboardAppointment = { scheduledAt: Date; status: string };
export type DashboardShift = {
	clinicName: string;
	requesterName: string | null;
	amountInCents: number | null;
	isPaid: boolean;
};

export function resolveAdminMonth(value: unknown, now = new Date()): string {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: 'America/Campo_Grande',
		year: 'numeric',
		month: '2-digit',
	}).formatToParts(now);
	const current = `${parts.find((p) => p.type === 'year')?.value}-${parts.find((p) => p.type === 'month')?.value}`;
	if (typeof value !== 'string') return current;
	try {
		getMonthBounds(value);
		return value;
	} catch {
		return current;
	}
}

export function getDashboardMonths(selected: string): string[] {
	getMonthBounds(selected);
	const [year, month] = selected.split('-').map(Number);
	return Array.from({ length: 6 }, (_, index) =>
		new Date(Date.UTC(year, month - 6 + index, 1)).toISOString().slice(0, 7),
	).filter((month) => month >= '2000-01');
}

export function summarizeAppointments(rows: readonly DashboardAppointment[], month: string) {
	const { start, end } = getMonthBounds(month);
	const selected = rows.filter((row) => row.scheduledAt >= start && row.scheduledAt < end);
	const count = (status: string) => selected.filter((row) => row.status === status).length;
	return {
		total: selected.length,
		completed: count('completed'),
		pending: count('pending'),
		confirmed: count('confirmed'),
		inProgress: count('in_progress'),
		cancelled: count('cancelled'),
		noShow: count('no_show'),
	};
}

export function buildDashboardTrend(
	months: readonly string[],
	appointments: readonly DashboardAppointment[],
	statements: readonly FinancialStatementRow[],
) {
	const payments = statements.flatMap((statement) => statement.payments);
	return months.map((month) => {
		const { start, end } = getMonthBounds(month);
		const report = buildFinancialReport(statements, payments, start, end);
		return {
			month,
			completed: summarizeAppointments(appointments, month).completed,
			billed: report.billedInCents,
			received: report.receivedInCents,
		};
	});
}

export function summarizeAdminShifts(shifts: readonly DashboardShift[]) {
	const summarize = (rows: readonly DashboardShift[]) => ({
		count: rows.length,
		total: rows.reduce((sum, row) => sum + (row.amountInCents ?? 0), 0),
		paid: rows.filter((row) => row.isPaid).reduce((sum, row) => sum + (row.amountInCents ?? 0), 0),
		unpaid: rows.filter((row) => !row.isPaid).reduce((sum, row) => sum + (row.amountInCents ?? 0), 0),
		unpaidCount: rows.filter((row) => !row.isPaid).length,
		missingAmount: rows.filter((row) => row.amountInCents === null).length,
	});
	const clinics = [...new Set(shifts.map((row) => row.clinicName))].sort().map((name) => {
		const rows = shifts.filter((row) => row.clinicName === name);
		const requester = (row: DashboardShift) => row.requesterName?.trim() || 'Escala fixa';
		return {
			name,
			...summarize(rows),
			requesters: [...new Set(rows.map(requester))]
				.sort()
				.map((name) => ({ name, ...summarize(rows.filter((row) => requester(row) === name)) })),
		};
	});
	return { ...summarize(shifts), clinics };
}

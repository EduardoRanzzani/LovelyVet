import 'server-only';
import { db } from '@/db';
import {
	appointmentsTable,
	careRemindersTable,
	customersTable,
	doctorsTable,
	petsTable,
	shiftsTable,
} from '@/db/schema';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireAdmin } from '@/lib/security/authorization';
import { getFinancialReport } from '@/lib/finance/financial-report-queries';
import { getMonthBounds } from '@/lib/finance/financial-report';
import { and, count, eq, gte, isNull, lt, gt } from 'drizzle-orm';
import {
	buildDashboardTrend,
	getDashboardMonths,
	resolveAdminMonth,
	summarizeAdminShifts,
	summarizeAppointments,
} from './admin-dashboard';

/** Exclusivo do admin; nunca recebe identidade ou escopo do cliente. */
export async function getAdminDashboard(requestedMonth?: string) {
	const context = await requireAuthContext();
	requireAdmin(context);
	const month = resolveAdminMonth(requestedMonth);
	const months = getDashboardMonths(month);
	const { start, end } = getMonthBounds(month);
	const historyStart = getMonthBounds(months[0]).start;
	const endDate = end.toISOString().slice(0, 10);
	const [report, appointments, shifts, pets, newPets, customers, newCustomers, doctors, pending, reminders] =
		await Promise.all([
			getFinancialReport(month),
			db
				.select({ scheduledAt: appointmentsTable.scheduledAt, status: appointmentsTable.status })
				.from(appointmentsTable)
				.where(and(gte(appointmentsTable.scheduledAt, historyStart), lt(appointmentsTable.scheduledAt, end))),
			db
				.select({
					clinicName: shiftsTable.clinicName,
					requesterName: shiftsTable.requesterName,
					amountInCents: shiftsTable.amountInCents,
					isPaid: shiftsTable.isPaid,
				})
				.from(shiftsTable)
				.where(and(lt(shiftsTable.startTime, end), gt(shiftsTable.endTime, start))),
			db.select({ total: count() }).from(petsTable),
			db
				.select({ total: count() })
				.from(petsTable)
				.where(and(gte(petsTable.createdAt, start), lt(petsTable.createdAt, end))),
			db.select({ total: count() }).from(customersTable),
			db
				.select({ total: count() })
				.from(customersTable)
				.where(and(gte(customersTable.createdAt, start), lt(customersTable.createdAt, end))),
			db.select({ total: count() }).from(doctorsTable),
			db.select({ total: count() }).from(appointmentsTable).where(eq(appointmentsTable.status, 'pending')),
			db
				.select({ total: count() })
				.from(careRemindersTable)
				.innerJoin(petsTable, eq(careRemindersTable.petId, petsTable.id))
				.where(
					and(
						eq(careRemindersTable.status, 'pending'),
						isNull(careRemindersTable.appointmentId),
						eq(petsTable.status, 'alive'),
						lt(careRemindersTable.dueDate, endDate),
					),
				),
		]);
	return {
		month,
		finance: {
			billedInCents: report.billedInCents,
			receivedInCents: report.receivedInCents,
			outstandingInCents: report.outstandingInCents,
			invoicedCount: report.invoicedCount,
		},
		appointments: summarizeAppointments(appointments, month),
		shifts: summarizeAdminShifts(shifts),
		registrations: {
			pets: pets[0].total,
			newPets: newPets[0].total,
			customers: customers[0].total,
			newCustomers: newCustomers[0].total,
			doctors: doctors[0].total,
		},
		pending: { confirmations: pending[0].total, reminders: reminders[0].total, charges: report.outstandingCount },
		trend: buildDashboardTrend(months, appointments, report.statements),
	};
}

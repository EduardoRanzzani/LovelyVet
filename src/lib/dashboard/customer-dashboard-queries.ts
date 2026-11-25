import 'server-only';
import { db } from '@/db';
import { appointmentsTable, breedsTable, careRemindersTable, petsTable, speciesTable } from '@/db/schema';
import { requireAuthContext } from '@/lib/security/auth-context';
import { getOwnFinancialReport } from '@/lib/finance/financial-report-queries';
import { and, asc, eq, gte, inArray, lt } from 'drizzle-orm';
import { buildCustomerDashboardAccess } from './customer-dashboard-access';
import { getCustomerDashboardWindow } from './customer-dashboard';

export async function getCustomerDashboard() {
	const access = buildCustomerDashboardAccess(await requireAuthContext());
	const now = new Date();
	const { today, month, end, endDate } = getCustomerDashboardWindow(now);
	const [pets, appointments, reminders, financial] = await Promise.all([
		db
			.select({
				id: petsTable.id,
				name: petsTable.name,
				photo: petsTable.photo,
				birthDate: petsTable.birthDate,
				status: petsTable.status,
				breed: breedsTable.name,
				species: speciesTable.name,
			})
			.from(petsTable)
			.innerJoin(breedsTable, eq(petsTable.breedId, breedsTable.id))
			.innerJoin(speciesTable, eq(breedsTable.specieId, speciesTable.id))
			.where(access.pets)
			.orderBy(asc(petsTable.name), asc(petsTable.id)),
		db
			.select({
				id: appointmentsTable.id,
				petId: appointmentsTable.petId,
				petName: petsTable.name,
				scheduledAt: appointmentsTable.scheduledAt,
				status: appointmentsTable.status,
			})
			.from(appointmentsTable)
			.innerJoin(petsTable, eq(appointmentsTable.petId, petsTable.id))
			.where(
				and(
					access.appointments,
					gte(appointmentsTable.scheduledAt, now),
					lt(appointmentsTable.scheduledAt, end),
					inArray(appointmentsTable.status, ['pending', 'confirmed']),
				),
			)
			.orderBy(asc(appointmentsTable.scheduledAt), asc(appointmentsTable.id))
			.limit(5),
		db
			.select({
				id: careRemindersTable.id,
				petId: careRemindersTable.petId,
				petName: petsTable.name,
				title: careRemindersTable.title,
				dueDate: careRemindersTable.dueDate,
				appointmentId: careRemindersTable.appointmentId,
			})
			.from(careRemindersTable)
			.innerJoin(petsTable, eq(careRemindersTable.petId, petsTable.id))
			.where(
				and(
					access.reminders,
					eq(careRemindersTable.type, 'vaccine'),
					eq(careRemindersTable.status, 'pending'),
					eq(petsTable.status, 'alive'),
					lt(careRemindersTable.dueDate, endDate),
				),
			)
			.orderBy(asc(careRemindersTable.dueDate), asc(careRemindersTable.id))
			.limit(5),
		getOwnFinancialReport(month),
	]);
	// Não retornamos titularidade, dados pessoais ou registros financeiros detalhados.
	return {
		today,
		pets,
		appointments,
		reminders,
		outstandingInCents: financial.outstandingInCents,
		outstandingCount: financial.outstandingCount,
	};
}

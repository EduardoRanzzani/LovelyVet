import 'server-only';
import { db } from '@/db';
import {
	appointmentChargesTable,
	appointmentsTable,
	chargePaymentsTable,
	customersTable,
	petsTable,
	usersTable,
} from '@/db/schema';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { buildAppointmentAccessCondition } from '@/lib/security/appointment-access';
import { and, eq, inArray } from 'drizzle-orm';
import { buildFinancialReport, getMonthBounds } from './financial-report';

export async function getFinancialReport(month: string, customerId?: string) {
	const context = await requireAuthContext();
	requireStaff(context);
	const { start, end } = getMonthBounds(month);
	const charges = await db
		.select({
			id: appointmentChargesTable.id,
			appointmentId: appointmentChargesTable.appointmentId,
			customerId: appointmentChargesTable.customerId,
			totalInCents: appointmentChargesTable.totalInCents,
			status: appointmentChargesTable.status,
			createdAt: appointmentChargesTable.createdAt,
			petName: petsTable.name,
		})
		.from(appointmentChargesTable)
		.innerJoin(
			appointmentsTable,
			eq(appointmentChargesTable.appointmentId, appointmentsTable.id),
		)
		.innerJoin(petsTable, eq(appointmentsTable.petId, petsTable.id))
		.where(
			and(
				buildAppointmentAccessCondition(context),
				customerId
					? eq(appointmentChargesTable.customerId, customerId)
					: undefined,
			),
		);
	const paymentRows = charges.length
		? await db
				.select({
					id: chargePaymentsTable.id,
					chargeId: chargePaymentsTable.chargeId,
					amountInCents: chargePaymentsTable.amountInCents,
					method: chargePaymentsTable.method,
					receivedAt: chargePaymentsTable.receivedAt,
				})
				.from(chargePaymentsTable)
				.innerJoin(
					appointmentChargesTable,
					eq(chargePaymentsTable.chargeId, appointmentChargesTable.id),
				)
				.innerJoin(
					appointmentsTable,
					eq(appointmentChargesTable.appointmentId, appointmentsTable.id),
				)
				.where(
					and(
						buildAppointmentAccessCondition(context),
						customerId
							? eq(appointmentChargesTable.customerId, customerId)
							: undefined,
					),
				)
		: [];
	return buildFinancialReport(charges, paymentRows, start, end);
}

export async function getFinancialCustomerNames(ids: readonly string[]) {
	const context = await requireAuthContext();
	requireStaff(context);
	if (!ids.length) return {} as Record<string, string>;
	// Retorna somente identificadores previamente obtidos das cobranças autorizadas.
	const rows = await db
		.select({ id: customersTable.id, name: usersTable.name })
		.from(customersTable)
		.innerJoin(usersTable, eq(customersTable.userId, usersTable.id))
		.innerJoin(
			appointmentChargesTable,
			eq(appointmentChargesTable.customerId, customersTable.id),
		)
		.innerJoin(
			appointmentsTable,
			eq(appointmentChargesTable.appointmentId, appointmentsTable.id),
		)
		.where(
			and(
				inArray(customersTable.id, [...ids]),
				buildAppointmentAccessCondition(context),
			),
		);
	return Object.fromEntries(rows.map((row) => [row.id, row.name]));
}

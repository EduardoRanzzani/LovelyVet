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
import { requireAuthContext, type AuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { buildAppointmentAccessCondition } from '@/lib/security/appointment-access';
import { and, eq, inArray } from 'drizzle-orm';
import { buildFinancialReport, getMonthBounds } from './financial-report';
import {
	buildFinancialAccessCondition,
	buildOwnFinancialChargeAccessCondition,
	requireFinancialTutorId,
} from './financial-access';

export async function getFinancialReport(month: string, customerId?: string) {
	const context = await requireAuthContext();
	requireStaff(context);
	return loadFinancialReport(context, month, customerId);
}

/** Financeiro dos pets vinculados ao tutor autenticado, sem filtro por titular. */
export async function getOwnFinancialReport(month: string) {
	const context = await requireAuthContext();
	requireFinancialTutorId(context);
	return loadFinancialReport(context, month);
}

/** Consulta apenas a cobrança solicitada, dentro do escopo atual do tutor. */
export async function getOwnFinancialCharge(month: string, chargeId: string) {
	const context = await requireAuthContext();
	requireFinancialTutorId(context);
	const report = await loadFinancialReport(context, month, undefined, chargeId);
	return report.statements.find((charge) => charge.id === chargeId) ?? null;
}

async function loadFinancialReport(context: AuthContext, month: string, customerId?: string, chargeId?: string) {
	const { start, end } = getMonthBounds(month);
	const condition =
		chargeId === undefined
			? buildFinancialAccessCondition(context, customerId)
			: buildOwnFinancialChargeAccessCondition(context, chargeId);
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
		.innerJoin(appointmentsTable, eq(appointmentChargesTable.appointmentId, appointmentsTable.id))
		.innerJoin(petsTable, eq(appointmentsTable.petId, petsTable.id))
		.where(condition);
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
				.innerJoin(appointmentChargesTable, eq(chargePaymentsTable.chargeId, appointmentChargesTable.id))
				.innerJoin(appointmentsTable, eq(appointmentChargesTable.appointmentId, appointmentsTable.id))
				.where(condition)
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
		.innerJoin(appointmentChargesTable, eq(appointmentChargesTable.customerId, customersTable.id))
		.innerJoin(appointmentsTable, eq(appointmentChargesTable.appointmentId, appointmentsTable.id))
		.where(and(inArray(customersTable.id, [...ids]), buildAppointmentAccessCondition(context)));
	return Object.fromEntries(rows.map((row) => [row.id, row.name]));
}

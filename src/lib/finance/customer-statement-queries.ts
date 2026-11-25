import 'server-only';
import { db } from '@/db';
import {
	appointmentChargesTable,
	appointmentItemsTable,
	appointmentProductItemsTable,
	appointmentsTable,
	productsTable,
	servicesTable,
} from '@/db/schema';
import { requireAuthContext, type AuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { buildFinancialAccessCondition, requireFinancialTutorId } from './financial-access';
import { and, eq, inArray } from 'drizzle-orm';
import { groupStatementItems, type StatementItem } from './customer-statement';

/** Extrato administrativo: somente itens das cobranças autorizadas do titular selecionado. */
export async function getCustomerStatementItems(customerId: string, chargeIds: readonly string[]) {
	const context = await requireAuthContext();
	requireStaff(context);
	return loadStatementItems(context, chargeIds, customerId);
}

export async function getOwnStatementItems(chargeIds: readonly string[]) {
	const context = await requireAuthContext();
	requireFinancialTutorId(context);
	return loadStatementItems(context, chargeIds);
}

async function loadStatementItems(context: AuthContext, chargeIds: readonly string[], customerId?: string) {
	if (!chargeIds.length) return groupStatementItems([]);
	const condition = and(
		buildFinancialAccessCondition(context, customerId),
		inArray(appointmentChargesTable.id, [...new Set(chargeIds)]),
	);
	const [services, products] = await Promise.all([
		db
			.select({
				chargeId: appointmentChargesTable.id,
				id: appointmentItemsTable.serviceId,
				name: servicesTable.name,
				quantity: appointmentItemsTable.quantity,
				unitPriceInCents: appointmentItemsTable.priceAtTimeInCents,
				discountInCents: appointmentItemsTable.discountInCents,
			})
			.from(appointmentChargesTable)
			.innerJoin(appointmentsTable, eq(appointmentChargesTable.appointmentId, appointmentsTable.id))
			.innerJoin(appointmentItemsTable, eq(appointmentItemsTable.appointmentId, appointmentsTable.id))
			.innerJoin(servicesTable, eq(appointmentItemsTable.serviceId, servicesTable.id))
			.where(condition),
		db
			.select({
				chargeId: appointmentChargesTable.id,
				id: appointmentProductItemsTable.id,
				name: productsTable.name,
				quantity: appointmentProductItemsTable.quantity,
				unitPriceInCents: appointmentProductItemsTable.priceAtTimeInCents,
				discountInCents: appointmentProductItemsTable.discountInCents,
			})
			.from(appointmentChargesTable)
			.innerJoin(appointmentsTable, eq(appointmentChargesTable.appointmentId, appointmentsTable.id))
			.innerJoin(
				appointmentProductItemsTable,
				eq(appointmentProductItemsTable.appointmentId, appointmentsTable.id),
			)
			.innerJoin(productsTable, eq(appointmentProductItemsTable.productId, productsTable.id))
			.where(condition),
	]);
	const items: StatementItem[] = [
		...services.map((item) => ({ ...item, kind: 'service' as const })),
		...products.map((item) => ({ ...item, kind: 'product' as const })),
	];
	return groupStatementItems(items);
}

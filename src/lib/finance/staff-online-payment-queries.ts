import 'server-only';
import { db } from '@/db';
import { appointmentChargesTable, appointmentsTable, onlinePaymentAttemptsTable } from '@/db/schema';
import { getMercadoPagoConfig } from '@/lib/integrations/mercado-pago-config';
import { buildAppointmentAccessCondition } from '@/lib/security/appointment-access';
import type { AuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { and, desc, eq, inArray } from 'drizzle-orm';
import type { StaffOnlinePaymentAttempt } from './staff-online-payment';

/** Nunca aceita o escopo informado pelo cliente: o JOIN valida o atendimento a cada leitura. */
export async function getStaffOnlinePaymentAttempts(
	context: AuthContext,
	chargeIds: readonly string[],
): Promise<StaffOnlinePaymentAttempt[]> {
	requireStaff(context);
	if (!chargeIds.length) return [];
	let config: ReturnType<typeof getMercadoPagoConfig>;
	try {
		config = getMercadoPagoConfig();
	} catch {
		// Configuração ausente não deve impedir o financeiro manual de funcionar.
		return [];
	}
	const rows = await db
		.select({
			id: onlinePaymentAttemptsTable.id,
			chargeId: onlinePaymentAttemptsTable.chargeId,
			amountInCents: onlinePaymentAttemptsTable.amountInCents,
			method: onlinePaymentAttemptsTable.method,
			installments: onlinePaymentAttemptsTable.installments,
			status: onlinePaymentAttemptsTable.status,
			createdAt: onlinePaymentAttemptsTable.createdAt,
			updatedAt: onlinePaymentAttemptsTable.updatedAt,
			expiresAt: onlinePaymentAttemptsTable.expiresAt,
			reconciliationReason: onlinePaymentAttemptsTable.reconciliationReason,
		})
		.from(onlinePaymentAttemptsTable)
		.innerJoin(appointmentChargesTable, eq(appointmentChargesTable.id, onlinePaymentAttemptsTable.chargeId))
		.innerJoin(appointmentsTable, eq(appointmentsTable.id, appointmentChargesTable.appointmentId))
		.where(
			and(
				buildAppointmentAccessCondition(context),
				inArray(onlinePaymentAttemptsTable.chargeId, [...new Set(chargeIds)]),
				eq(onlinePaymentAttemptsTable.environment, config.environment),
				eq(onlinePaymentAttemptsTable.collectorId, config.collectorId),
			),
		)
		.orderBy(desc(onlinePaymentAttemptsTable.createdAt));
	return rows.map((row) => ({
		...row,
		method: row.method as StaffOnlinePaymentAttempt['method'],
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
		expiresAt: row.expiresAt?.toISOString() ?? null,
	}));
}

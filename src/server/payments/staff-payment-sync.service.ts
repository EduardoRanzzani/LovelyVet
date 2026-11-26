import 'server-only';
import { db } from '@/db';
import { appointmentChargesTable, appointmentsTable, onlinePaymentAttemptsTable } from '@/db/schema';
import { assertOnlinePaymentScope } from '@/lib/finance/online-payment-scope';
import { canStaffSyncAttempt } from '@/lib/finance/staff-online-payment';
import { getMercadoPagoConfig } from '@/lib/integrations/mercado-pago-config';
import { getMercadoPagoOrderClient } from '@/lib/integrations/mercado-pago';
import { buildAppointmentAccessCondition, lockAccessibleAppointment } from '@/lib/security/appointment-access';
import type { AuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { and, eq, lte } from 'drizzle-orm';
import { findUniqueRecoveryOrder, getRecoverySearchOptions } from './recovery-policy';
import { reconcileMercadoPagoOrder } from './reconciliation.service';

const REFRESH_INTERVAL_MS = 15_000;

/** Sincronização sob demanda para Admin/Doctor, sem Pix, dados de cartão ou IDs externos na resposta. */
export async function syncStaffOnlinePayment(context: AuthContext, attemptId: string) {
	requireStaff(context);
	const config = getMercadoPagoConfig();
	const scoped = and(
		eq(onlinePaymentAttemptsTable.id, attemptId),
		eq(onlinePaymentAttemptsTable.environment, config.environment),
		eq(onlinePaymentAttemptsTable.collectorId, config.collectorId),
	);
	const condition = and(scoped, buildAppointmentAccessCondition(context));
	const selectAttempt = (reader: Pick<typeof db, 'select'>) =>
		reader
			.select({
				attempt: onlinePaymentAttemptsTable,
				appointmentId: appointmentsTable.id,
				petId: appointmentsTable.petId,
			})
			.from(onlinePaymentAttemptsTable)
			.innerJoin(appointmentChargesTable, eq(appointmentChargesTable.id, onlinePaymentAttemptsTable.chargeId))
			.innerJoin(appointmentsTable, eq(appointmentsTable.id, appointmentChargesTable.appointmentId))
			.where(condition);
	const claimed = await db.transaction(async (tx) => {
		const [candidate] = await selectAttempt(tx);
		if (!candidate) throw new Error('Tentativa não encontrada.');
		await lockAccessibleAppointment(tx, context, candidate.appointmentId);
		const [row] = await selectAttempt(tx);
		if (!row) throw new Error('Tentativa não encontrada.');
		assertOnlinePaymentScope({ environment: config.environment, petId: row.petId });
		const attempt = row.attempt;
		if (!canStaffSyncAttempt(attempt.status)) return { attempt, refresh: false };
		const now = new Date();
		// Reserva curta no banco; chamadas à API ocorrem somente depois do commit.
		const updated = await tx
			.update(onlinePaymentAttemptsTable)
			.set({ updatedAt: now })
			.where(
				and(
					scoped,
					eq(onlinePaymentAttemptsTable.status, attempt.status),
					lte(onlinePaymentAttemptsTable.updatedAt, new Date(now.getTime() - REFRESH_INTERVAL_MS)),
				),
			)
			.returning({ id: onlinePaymentAttemptsTable.id });
		return { attempt, refresh: updated.length === 1 };
	});
	let remoteUnavailable = false;
	if (claimed.refresh) {
		try {
			let orderId = claimed.attempt.providerOrderId;
			if (!orderId) {
				const options = getRecoverySearchOptions(attemptId, claimed.attempt.createdAt, new Date());
				if (options)
					orderId = findUniqueRecoveryOrder(await getMercadoPagoOrderClient().search({ options }), attemptId);
			}
			if (orderId) await reconcileMercadoPagoOrder(orderId, attemptId);
			else remoteUnavailable = true;
		} catch {
			// Erros remotos são ocultados para não divulgar payloads privados ao operador.
			remoteUnavailable = true;
		}
	}
	const [current] = await selectAttempt(db);
	if (!current) throw new Error('Tentativa não encontrada.');
	assertOnlinePaymentScope({ environment: config.environment, petId: current.petId });
	return {
		status: current.attempt.status,
		remoteUnavailable,
		retryAfterSeconds: REFRESH_INTERVAL_MS / 1000,
	};
}

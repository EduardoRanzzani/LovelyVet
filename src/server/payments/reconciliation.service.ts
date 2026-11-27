import 'server-only';
import { db } from '@/db';
import {
	appointmentChargesTable,
	appointmentsTable,
	chargePaymentsTable,
	onlinePaymentAttemptsTable,
} from '@/db/schema';
import { assertOnlinePaymentScope } from '@/lib/finance/online-payment-scope';
import { getMercadoPagoConfig } from '@/lib/integrations/mercado-pago-config';
import { getMercadoPagoOrderClient } from '@/lib/integrations/mercado-pago';
import { and, eq, sql } from 'drizzle-orm';
import { planReconciliation, readReconciliationReference } from './reconciliation-policy';
import { readPendingPix, readPixExpiration } from './recovery-policy';
import { calculateChargeBalance } from '@/lib/finance/ledger';

export async function reconcileMercadoPagoOrder(orderId: string, expectedAttemptId?: string) {
	if (!/^[A-Za-z0-9_-]{1,128}$/.test(orderId)) throw new Error('Order inválida.');
	const config = getMercadoPagoConfig();
	// A flag de novas cobranças NÃO desliga conciliação de tentativas existentes.
	// Nenhuma chamada remota dentro de uma transação.
	const order: unknown = await getMercadoPagoOrderClient().get({ id: orderId });
	const attemptId = readReconciliationReference(order, orderId);
	if (!attemptId) return;
	if (expectedAttemptId !== undefined && attemptId !== expectedAttemptId)
		throw new Error('Referência remota incompatível.');
	const scoped = and(
		eq(onlinePaymentAttemptsTable.id, attemptId),
		eq(onlinePaymentAttemptsTable.environment, config.environment),
		eq(onlinePaymentAttemptsTable.collectorId, config.collectorId),
	);
	return db.transaction(async (tx) => {
		const [candidate] = await tx
			.select({ appointmentId: appointmentChargesTable.appointmentId })
			.from(onlinePaymentAttemptsTable)
			.innerJoin(appointmentChargesTable, eq(appointmentChargesTable.id, onlinePaymentAttemptsTable.chargeId))
			.where(scoped);
		if (!candidate) return;
		// Mesma ordem de lock do financeiro manual; reconsulta após adquirir a trava.
		await tx.execute(sql`SELECT id FROM appointments WHERE id = ${candidate.appointmentId} FOR UPDATE`);
		await tx.execute(sql`SELECT id FROM online_payment_attempts WHERE id = ${attemptId} FOR UPDATE`);
		const [row] = await tx
			.select({
				attempt: onlinePaymentAttemptsTable,
				charge: appointmentChargesTable,
				appointment: appointmentsTable,
			})
			.from(onlinePaymentAttemptsTable)
			.innerJoin(appointmentChargesTable, eq(appointmentChargesTable.id, onlinePaymentAttemptsTable.chargeId))
			.innerJoin(appointmentsTable, eq(appointmentsTable.id, appointmentChargesTable.appointmentId))
			.where(and(scoped, eq(appointmentsTable.id, candidate.appointmentId)));
		if (!row) return;
		assertOnlinePaymentScope({ environment: config.environment, petId: row.appointment.petId });
		const payments = await tx
			.select()
			.from(chargePaymentsTable)
			.where(eq(chargePaymentsTable.chargeId, row.charge.id));
		const plan = planReconciliation(
			order,
			orderId,
			row.attempt,
			{ ...row.charge, appointmentStatus: row.appointment.status, isPaid: row.appointment.isPaid },
			payments,
		);
		if (plan.kind === 'ignore') return;
		const now = new Date();
		if (plan.kind === 'review') {
			await tx
				.update(onlinePaymentAttemptsTable)
				.set({ status: 'review', reconciliationReason: plan.reason, updatedAt: now })
				.where(scoped);
			return;
		}
		if (plan.kind === 'enrich') {
			await tx
				.update(onlinePaymentAttemptsTable)
				.set({ providerPaidAmountInCents: plan.providerPaidAmountInCents, updatedAt: now })
				.where(scoped);
			return;
		}
		const { providerOrderId, providerPaymentId, providerStatus, providerStatusDetail, status } = plan;
		const expiresAt = row.attempt.method === 'pix' && status === 'pending' ? readPixExpiration(order) : null;
		await tx
			.update(onlinePaymentAttemptsTable)
			.set({
				providerOrderId,
				providerPaymentId,
				providerStatus,
				providerStatusDetail,
				status,
				reconciliationReason: null,
				...(expiresAt ? { expiresAt } : {}),
				updatedAt: now,
				...(plan.kind === 'credit'
					? { approvedAt: now, providerPaidAmountInCents: plan.providerPaidAmountInCents }
					: {}),
			})
			.where(scoped);
		if (plan.kind === 'credit') {
			await tx.insert(chargePaymentsTable).values({
				chargeId: row.charge.id,
				operationKey: attemptId,
				onlinePaymentAttemptId: attemptId,
				source: 'mercado_pago',
				receivedBy: null,
				amountInCents: row.attempt.amountInCents,
				method: row.attempt.method,
				receivedAt: now,
			});
			if (plan.settlesCharge)
				await tx
					.update(appointmentsTable)
					.set({ isPaid: true, updatedAt: now })
					.where(eq(appointmentsTable.id, row.appointment.id));
		}
		if (
			expectedAttemptId !== undefined &&
			plan.kind === 'update' &&
			status === 'pending' &&
			row.attempt.method === 'pix' &&
			row.charge.status === 'open' &&
			row.appointment.status === 'completed' &&
			!row.appointment.isPaid &&
			calculateChargeBalance(row.charge.totalInCents, payments).balanceInCents >= row.attempt.amountInCents &&
			row.attempt.amountInCents > 0
		) {
			const pix = readPendingPix(order);
			if (pix) return { orderId: providerOrderId, paymentId: providerPaymentId, pix };
		}
	});
}

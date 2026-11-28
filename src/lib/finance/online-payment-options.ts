import 'server-only';
import { db } from '@/db';
import {
	appointmentChargesTable,
	appointmentsTable,
	chargePaymentsTable,
	onlinePaymentAttemptsTable,
} from '@/db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { AuthContext } from '@/lib/security/auth-context';
import { buildFinancialAccessCondition, requireFinancialTutorId } from './financial-access';
import { PAYMENT_TEST_PET_ID } from './online-payment-scope';
import { getMercadoPagoConfig, isMercadoPagoEnabled } from '@/lib/integrations/mercado-pago-config';
import { assertOnlinePaymentReleaseReady } from '@/server/payments/payment.service';
import { canOfferOnlinePayment, isActivePaymentStatus, type OnlinePaymentOption } from './online-payment-view';

// Somente metadados mínimos; não expor IDs externos nem dados de outros iniciadores.
export async function getOwnOnlinePaymentOptions(
	context: AuthContext,
	charges: readonly { id: string; status: string; balanceInCents: number }[],
	includeApproved = false,
) {
	requireFinancialTutorId(context);
	const result = new Map<string, OnlinePaymentOption>();
	if (!charges.length) return result;
	let config: ReturnType<typeof getMercadoPagoConfig>;
	let enabled: boolean;
	try {
		config = getMercadoPagoConfig();
		enabled = isMercadoPagoEnabled();
	} catch {
		return result;
	}
	// Exibir prévia exclusivamente em teste; produção exige os gates de criação.
	let ready = false;
	try {
		assertOnlinePaymentReleaseReady(config.environment);
		ready = enabled;
	} catch {
		/* Gate ainda fechado. */
	}
	const rows = await db
		.select({
			chargeId: appointmentChargesTable.id,
			petId: appointmentsTable.petId,
			appointmentStatus: appointmentsTable.status,
		})
		.from(appointmentChargesTable)
		.innerJoin(appointmentsTable, eq(appointmentsTable.id, appointmentChargesTable.appointmentId))
		.where(
			and(
				buildFinancialAccessCondition(context),
				inArray(
					appointmentChargesTable.id,
					charges.map((c) => c.id),
				),
			),
		);
	const permitted = rows.filter((row) =>
		config.environment === 'test' ? row.petId === PAYMENT_TEST_PET_ID : row.petId !== PAYMENT_TEST_PET_ID,
	);
	if (!permitted.length) return result;
	const attempts = await db
		.select({
			id: onlinePaymentAttemptsTable.id,
			chargeId: onlinePaymentAttemptsTable.chargeId,
			initiatedBy: onlinePaymentAttemptsTable.initiatedBy,
			status: onlinePaymentAttemptsTable.status,
			approvedAt: onlinePaymentAttemptsTable.approvedAt,
			inScope: sql<boolean>`(${onlinePaymentAttemptsTable.environment} = ${config.environment} and ${onlinePaymentAttemptsTable.collectorId} = ${config.collectorId})`,
			hasReceipt: sql<boolean>`exists (select 1 from ${chargePaymentsTable} where ${chargePaymentsTable.onlinePaymentAttemptId} = ${onlinePaymentAttemptsTable.id} and ${chargePaymentsTable.chargeId} = ${onlinePaymentAttemptsTable.chargeId} and ${chargePaymentsTable.operationKey} = ${onlinePaymentAttemptsTable.id} and ${chargePaymentsTable.amountInCents} = ${onlinePaymentAttemptsTable.amountInCents} and ${chargePaymentsTable.method} = ${onlinePaymentAttemptsTable.method} and ${chargePaymentsTable.source} = 'mercado_pago')`,
		})
		.from(onlinePaymentAttemptsTable)
		.innerJoin(appointmentChargesTable, eq(appointmentChargesTable.id, onlinePaymentAttemptsTable.chargeId))
		.innerJoin(appointmentsTable, eq(appointmentsTable.id, appointmentChargesTable.appointmentId))
		.where(
			and(
				buildFinancialAccessCondition(context),
				inArray(
					onlinePaymentAttemptsTable.chargeId,
					permitted.map((row) => row.chargeId),
				),
			),
		);
	const byId = new Map(charges.map((charge) => [charge.id, charge]));
	for (const row of permitted) {
		const charge = byId.get(row.chargeId);
		if (!charge) continue;
		const related = attempts.filter((a) => a.chargeId === row.chargeId);
		const blocking = related.filter(
			(a) =>
				!['cancelled', 'rejected', 'expired'].includes(a.status) && !(a.status === 'approved' && a.hasReceipt),
		);
		const eligible = canOfferOnlinePayment(charge, row.appointmentStatus);
		const ownBlocking =
			blocking.length === 1 &&
			blocking[0]?.inScope &&
			blocking[0]?.initiatedBy === context.userId &&
			(isActivePaymentStatus(blocking[0].status) || blocking[0].status === 'review')
				? blocking[0]
				: undefined;
		// Recupera a aprovação própria mais recente apenas na cobrança quitada; nunca sobrepõe bloqueios.
		const ownApproved = related
			.filter((a) => a.inScope && a.initiatedBy === context.userId && a.status === 'approved' && a.hasReceipt)
			.sort(
				(a, b) => (b.approvedAt?.getTime() ?? 0) - (a.approvedAt?.getTime() ?? 0) || b.id.localeCompare(a.id),
			);
		const own =
			ownBlocking ??
			(includeApproved && !eligible && blocking.length === 0 && ownApproved.length > 0
				? ownApproved[0]
				: undefined);
		if (!own && (!eligible || (!ready && config.environment !== 'test'))) continue;
		result.set(row.chargeId, {
			canStart: ready && eligible && blocking.length === 0,
			attemptId: own?.id ?? null,
			testMode: config.environment === 'test',
		});
	}
	return result;
}

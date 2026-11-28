import 'server-only';
import { db } from '@/db';
import {
	appointmentChargesTable,
	appointmentsTable,
	chargePaymentsTable,
	onlinePaymentAttemptsTable,
} from '@/db/schema';
import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import type { AuthContext } from '@/lib/security/auth-context';
import { buildFinancialAccessCondition, requireFinancialTutorId } from './financial-access';
import { getMercadoPagoConfig } from '@/lib/integrations/mercado-pago-config';
import { PAYMENT_TEST_PET_ID } from './online-payment-scope';
import { calculateChargeBalance } from './ledger';
import type { OnlinePaymentSnapshot, PaymentReceiptView } from './online-payment-view';

// All receipt reads require current pet access, ownership, environment and ledger identity.
function receiptScope(context: AuthContext, config: ReturnType<typeof getMercadoPagoConfig>) {
	return and(
		buildFinancialAccessCondition(context),
		eq(onlinePaymentAttemptsTable.initiatedBy, context.userId),
		eq(onlinePaymentAttemptsTable.environment, config.environment),
		eq(onlinePaymentAttemptsTable.collectorId, config.collectorId),
		eq(onlinePaymentAttemptsTable.status, 'approved'),
		eq(appointmentChargesTable.status, 'open'),
		config.environment === 'test'
			? eq(appointmentsTable.petId, PAYMENT_TEST_PET_ID)
			: ne(appointmentsTable.petId, PAYMENT_TEST_PET_ID),
	);
}

const receiptIdentity = and(
	eq(chargePaymentsTable.onlinePaymentAttemptId, onlinePaymentAttemptsTable.id),
	eq(chargePaymentsTable.chargeId, onlinePaymentAttemptsTable.chargeId),
	eq(chargePaymentsTable.operationKey, onlinePaymentAttemptsTable.id),
	eq(chargePaymentsTable.amountInCents, onlinePaymentAttemptsTable.amountInCents),
	eq(chargePaymentsTable.method, onlinePaymentAttemptsTable.method),
	eq(chargePaymentsTable.source, 'mercado_pago'),
);

function receiptConfig() {
	try {
		return getMercadoPagoConfig();
	} catch {
		return null;
	}
}

/** Minimal per-receipt links, never expose another initiator's attempt ID. */
export async function getOwnOnlineReceiptLinks(context: AuthContext, chargeIds: readonly string[]) {
	requireFinancialTutorId(context);
	const config = receiptConfig();
	if (!config || !chargeIds.length) return new Map<string, string>();
	const rows = await db
		.select({ receiptId: chargePaymentsTable.id, attemptId: onlinePaymentAttemptsTable.id })
		.from(onlinePaymentAttemptsTable)
		.innerJoin(chargePaymentsTable, receiptIdentity)
		.innerJoin(appointmentChargesTable, eq(appointmentChargesTable.id, onlinePaymentAttemptsTable.chargeId))
		.innerJoin(appointmentsTable, eq(appointmentsTable.id, appointmentChargesTable.appointmentId))
		.where(and(receiptScope(context, config), inArray(onlinePaymentAttemptsTable.chargeId, [...chargeIds])));
	return new Map(rows.map((row) => [row.receiptId, row.attemptId]));
}

/** Historical read: no provider request, no refresh, no creation flag and no write. */
export async function getOwnOnlineReceipt(context: AuthContext, chargeId: string, attemptId: string) {
	requireFinancialTutorId(context);
	const config = receiptConfig();
	if (!config) return null;
	const rows = await db
		.select({
			amountInCents: onlinePaymentAttemptsTable.amountInCents,
			method: onlinePaymentAttemptsTable.method,
			installments: onlinePaymentAttemptsTable.installments,
			providerPaidAmountInCents: onlinePaymentAttemptsTable.providerPaidAmountInCents,
			totalInCents: appointmentChargesTable.totalInCents,
			receivedAt: chargePaymentsTable.receivedAt,
			paidInCents:
				sql<number>`coalesce((select sum(${chargePaymentsTable.amountInCents}) from ${chargePaymentsTable} where ${chargePaymentsTable.chargeId} = ${appointmentChargesTable.id}), 0)`.mapWith(
					Number,
				),
			receipts: sql<PaymentReceiptView[]>`coalesce((select jsonb_agg(jsonb_build_object(
                    'amountInCents', p.amount_in_cents, 'method', p.method,
                    'current', coalesce(p.online_payment_attempt_id = ${onlinePaymentAttemptsTable.id}, false),
                    'ownOnline', a.id is not null,
                    'providerPaidAmountInCents', a.provider_paid_amount_in_cents,
                    'installments', a.installments
                ) order by p.received_at, p.id)
                from charge_payments p
                left join online_payment_attempts a on a.id = p.online_payment_attempt_id
                    and a.charge_id = p.charge_id and a.amount_in_cents = p.amount_in_cents
                    and a.method = p.method and p.source = 'mercado_pago' and p.operation_key = a.id
                    and a.status = 'approved' and a.initiated_by = ${context.userId}
                    and a.environment = ${config.environment} and a.collector_id = ${config.collectorId}
                where p.charge_id = ${appointmentChargesTable.id}), '[]'::jsonb)`,
		})
		.from(onlinePaymentAttemptsTable)
		.innerJoin(chargePaymentsTable, receiptIdentity)
		.innerJoin(appointmentChargesTable, eq(appointmentChargesTable.id, onlinePaymentAttemptsTable.chargeId))
		.innerJoin(appointmentsTable, eq(appointmentsTable.id, appointmentChargesTable.appointmentId))
		.where(
			and(
				receiptScope(context, config),
				eq(onlinePaymentAttemptsTable.chargeId, chargeId),
				eq(onlinePaymentAttemptsTable.id, attemptId),
			),
		);
	if (rows.length !== 1) return null;
	const row = rows[0];
	const balance = calculateChargeBalance(
		row.totalInCents,
		row.paidInCents ? [{ amountInCents: row.paidInCents }] : [],
	);
	const payment: OnlinePaymentSnapshot = {
		attemptId,
		status: 'approved',
		amountInCents: row.amountInCents,
		method: row.method,
		installments: row.installments,
		balanceInCents: balance.balanceInCents,
		confirmation: {
			totalInCents: balance.totalInCents,
			paidInCents: balance.paidInCents,
			providerPaidAmountInCents: row.providerPaidAmountInCents,
			receipts: row.receipts,
		},
		pix: null,
		retainPix: false,
		remoteUnavailable: false,
		retryAfterSeconds: 0,
	};
	return { payment, receivedAt: row.receivedAt, testMode: config.environment === 'test' };
}

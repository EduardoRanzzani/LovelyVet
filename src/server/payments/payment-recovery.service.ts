import 'server-only';
import QRCode from 'qrcode';
import { db } from '@/db';
import { appointmentChargesTable, appointmentsTable, onlinePaymentAttemptsTable } from '@/db/schema';
import { buildFinancialAccessCondition, requireFinancialTutorId } from '@/lib/finance/financial-access';
import { assertOnlinePaymentScope } from '@/lib/finance/online-payment-scope';
import { getMercadoPagoConfig } from '@/lib/integrations/mercado-pago-config';
import { getMercadoPagoOrderClient } from '@/lib/integrations/mercado-pago';
import { lockAccessibleAppointment } from '@/lib/security/appointment-access';
import type { AuthContext } from '@/lib/security/auth-context';
import { and, eq, lte } from 'drizzle-orm';
import { findUniqueRecoveryOrder, getRecoverySearchOptions } from './recovery-policy';
import { reconcileMercadoPagoOrder } from './reconciliation.service';

const REFRESH_INTERVAL_MS = 15_000;

// Apenas o iniciador da tentativa, com vínculo atual, pode receber seus dados Pix.
// A consulta não depende da flag de criação; tentativas existentes ainda precisam conciliar.
export async function refreshOnlinePayment(context: AuthContext, attemptId: string, initial = false) {
	requireFinancialTutorId(context);
	const config = getMercadoPagoConfig();
	const scoped = and(
		eq(onlinePaymentAttemptsTable.id, attemptId),
		eq(onlinePaymentAttemptsTable.initiatedBy, context.userId),
		eq(onlinePaymentAttemptsTable.environment, config.environment),
		eq(onlinePaymentAttemptsTable.collectorId, config.collectorId),
	);
	const access = and(scoped, buildFinancialAccessCondition(context));
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
			.where(access);
	const claimed = await db.transaction(async (tx) => {
		const [candidate] = await selectAttempt(tx);
		if (!candidate) throw new Error('Tentativa não encontrada.');
		await lockAccessibleAppointment(tx, context, candidate.appointmentId);
		const [row] = await selectAttempt(tx);
		if (!row) throw new Error('Tentativa não encontrada.');
		assertOnlinePaymentScope({ environment: config.environment, petId: row.petId });
		const attempt = row.attempt;
		const now = new Date();
		if (initial && !attempt.providerOrderId) return { attempt, refresh: false };
		if (!['created', 'processing', 'pending'].includes(attempt.status)) return { attempt, refresh: false };
		// Reserva também as consultas concorrentes. Nunca mantém locks durante a rede.
		const updated = await tx
			.update(onlinePaymentAttemptsTable)
			.set({ updatedAt: now })
			.where(
				and(
					scoped,
					eq(onlinePaymentAttemptsTable.status, attempt.status),
					initial && attempt.providerOrderId
						? undefined
						: lte(onlinePaymentAttemptsTable.updatedAt, new Date(now.getTime() - REFRESH_INTERVAL_MS)),
				),
			)
			.returning({ id: onlinePaymentAttemptsTable.id });
		return { attempt, refresh: updated.length === 1 };
	});
	let result: Awaited<ReturnType<typeof reconcileMercadoPagoOrder>> = undefined;
	let remoteUnavailable = false;
	if (claimed.refresh) {
		try {
			let orderId = claimed.attempt.providerOrderId;
			if (!orderId) {
				const options = getRecoverySearchOptions(attemptId, claimed.attempt.createdAt, new Date());
				if (options)
					orderId = findUniqueRecoveryOrder(await getMercadoPagoOrderClient().search({ options }), attemptId);
			}
			if (orderId) result = await reconcileMercadoPagoOrder(orderId, attemptId);
			else remoteUnavailable = true;
		} catch {
			// Falha de rede, busca ambígua ou persistência: não liberar nem criar outra Order.
			// Não propagar dados sensíveis da API ao cliente/log do safe-action.
			remoteUnavailable = true;
		}
	}
	// Gerar imagem localmente fora da transação; falha não descarta o código.
	let pngBase64 = result?.pix.pngBase64 ?? null;
	if (result && !pngBase64) {
		try {
			pngBase64 = (
				await QRCode.toBuffer(result.pix.code, {
					type: 'png',
					errorCorrectionLevel: 'M',
					margin: 4,
					width: 320,
				})
			).toString('base64');
		} catch {
			// O Copia e Cola continua disponível.
		}
	}
	// Reautoriza após a rede; nenhuma informação sensível de outro tutor ou ambiente.
	const [current] = await selectAttempt(db);
	if (!current) throw new Error('Tentativa não encontrada.');
	assertOnlinePaymentScope({ environment: config.environment, petId: current.petId });
	const attempt = current.attempt;
	const pix =
		result &&
		attempt.status === 'pending' &&
		attempt.method === 'pix' &&
		attempt.providerOrderId === result.orderId &&
		attempt.providerPaymentId === result.paymentId
			? {
					code: result.pix.code,
					pngBase64,
					...(attempt.expiresAt ? { expiresAt: attempt.expiresAt.toISOString() } : {}),
				}
			: null;
	return {
		attemptId,
		status: attempt.status,
		amountInCents: attempt.amountInCents,
		pix,
		remoteUnavailable,
		retryAfterSeconds: REFRESH_INTERVAL_MS / 1000,
	};
}

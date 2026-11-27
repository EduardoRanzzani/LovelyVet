import 'server-only';
import { db } from '@/db';
import {
	appointmentChargesTable,
	appointmentsTable,
	chargePaymentsTable,
	onlinePaymentAttemptsTable,
	usersTable,
} from '@/db/schema';
import type { OnlinePaymentInput } from '@/api/schema/online-payment.schema';
import { requireFinancialTutorId, buildFinancialAccessCondition } from '@/lib/finance/financial-access';
import { assertOnlinePaymentScope } from '@/lib/finance/online-payment-scope';
import { assertNoBlockingOnlinePayment, getOnlinePaymentAmount } from '@/lib/finance/online-payment-reservation';
import {
	assertMercadoPagoEnabled,
	assertMercadoPagoTestCollector,
	getMercadoPagoConfig,
} from '@/lib/integrations/mercado-pago-config';
import { getMercadoPagoOrderClient } from '@/lib/integrations/mercado-pago';
import { lockAccessibleAppointment } from '@/lib/security/appointment-access';
import type { AuthContext } from '@/lib/security/auth-context';
import { and, eq, isNull } from 'drizzle-orm';
import { submitOnlinePayment } from './payment-orchestrator';
import type { ReservedPayment } from './order-request';

// Gate temporário: somente next dev + configuração de teste. Produção continua bloqueada.
export function assertOnlinePaymentReleaseReady(
	environment: ReturnType<typeof getMercadoPagoConfig>['environment'],
): void {
	if (environment !== 'test' || process.env.NODE_ENV !== 'development') {
		throw new Error('Criação de pagamentos online liberada somente para homologação local.');
	}
}

export async function createOnlinePayment(context: AuthContext, input: OnlinePaymentInput) {
	requireFinancialTutorId(context);
	assertMercadoPagoEnabled();
	const config = getMercadoPagoConfig();
	assertOnlinePaymentReleaseReady(config.environment);
	// Autorizar antes da rede; repetir autorização e escopo sob lock na reserva.
	const [candidate] = await db
		.select({ appointmentId: appointmentChargesTable.appointmentId, petId: appointmentsTable.petId })
		.from(appointmentChargesTable)
		.innerJoin(appointmentsTable, eq(appointmentsTable.id, appointmentChargesTable.appointmentId))
		.where(and(eq(appointmentChargesTable.id, input.chargeId), buildFinancialAccessCondition(context)));
	if (!candidate) throw new Error('Cobrança não encontrada.');
	assertOnlinePaymentScope({ environment: config.environment, petId: candidate.petId });
	await assertMercadoPagoTestCollector(config);
	const client = getMercadoPagoOrderClient();
	return submitOnlinePayment(input, {
		reserve: () =>
			db.transaction(async (tx): Promise<ReservedPayment> => {
				const appointment = await lockAccessibleAppointment(tx, context, candidate.appointmentId);
				assertOnlinePaymentScope({ environment: config.environment, petId: appointment.petId });
				const [charge] = await tx
					.select()
					.from(appointmentChargesTable)
					.where(
						and(
							eq(appointmentChargesTable.id, input.chargeId),
							eq(appointmentChargesTable.appointmentId, appointment.id),
						),
					);
				if (!charge || appointment.status !== 'completed') {
					throw new Error('Cobrança não disponível.');
				}
				const attempts = await tx
					.select({
						id: onlinePaymentAttemptsTable.id,
						status: onlinePaymentAttemptsTable.status,
						amountInCents: onlinePaymentAttemptsTable.amountInCents,
						method: onlinePaymentAttemptsTable.method,
					})
					.from(onlinePaymentAttemptsTable)
					.where(eq(onlinePaymentAttemptsTable.chargeId, charge.id));
				const payments = await tx
					.select()
					.from(chargePaymentsTable)
					.where(eq(chargePaymentsTable.chargeId, charge.id));
				assertNoBlockingOnlinePayment(attempts, payments);
				const amountInCents = getOnlinePaymentAmount(charge, payments, input);
				const [user] = await tx
					.select({ email: usersTable.email })
					.from(usersTable)
					.where(eq(usersTable.id, context.userId));
				if (!user?.email) throw new Error('E-mail do tutor não encontrado.');
				const [attempt] = await tx
					.insert(onlinePaymentAttemptsTable)
					.values({
						chargeId: charge.id,
						initiatedBy: context.userId,
						environment: config.environment,
						collectorId: config.collectorId,
						amountInCents,
						method: input.method,
						installments: input.method === 'pix' ? 1 : input.installments,
						status: 'processing',
					})
					.returning({ id: onlinePaymentAttemptsTable.id });
				if (!attempt) throw new Error('Falha ao reservar pagamento.');
				return {
					id: attempt.id,
					chargeId: charge.id,
					amountInCents,
					payerEmail: user.email,
					environment: config.environment,
					collectorId: config.collectorId,
				};
			}),
		createOrder: (request) => client.create(request),
		persist: async (attempt, identifiers) => {
			// Não rebaixar estado ou substituir identificadores após conciliação concorrente.
			const updated = await db
				.update(onlinePaymentAttemptsTable)
				.set({ ...identifiers, updatedAt: new Date() })
				.where(
					and(
						eq(onlinePaymentAttemptsTable.id, attempt.id),
						eq(onlinePaymentAttemptsTable.environment, attempt.environment),
						eq(onlinePaymentAttemptsTable.collectorId, attempt.collectorId),
						eq(onlinePaymentAttemptsTable.status, 'processing'),
						isNull(onlinePaymentAttemptsTable.providerOrderId),
					),
				)
				.returning({ id: onlinePaymentAttemptsTable.id });
			if (updated.length !== 1) throw new Error('Tentativa mudou durante o processamento.');
		},
		markUncertain: async (attempt) => {
			await db
				.update(onlinePaymentAttemptsTable)
				.set({ reconciliationReason: 'order_creation_uncertain', updatedAt: new Date() })
				.where(
					and(
						eq(onlinePaymentAttemptsTable.id, attempt.id),
						eq(onlinePaymentAttemptsTable.environment, attempt.environment),
						eq(onlinePaymentAttemptsTable.collectorId, attempt.collectorId),
						eq(onlinePaymentAttemptsTable.status, 'processing'),
						isNull(onlinePaymentAttemptsTable.providerOrderId),
					),
				);
		},
	});
}

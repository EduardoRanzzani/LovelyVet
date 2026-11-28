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
	assertMercadoPagoProductionCollector,
	getMercadoPagoConfig,
} from '@/lib/integrations/mercado-pago-config';
import { getClerkEnvironment } from '@/lib/integrations/clerk-environment';
import { getMercadoPagoOrderClient } from '@/lib/integrations/mercado-pago';
import { lockAccessibleAppointment } from '@/lib/security/appointment-access';
import type { AuthContext } from '@/lib/security/auth-context';
import { and, eq, isNull } from 'drizzle-orm';
import { submitOnlinePayment } from './payment-orchestrator';
import { readStatementDescriptor, type ReservedPayment } from './order-request';

// Gate de criação: não interfere na recuperação ou conciliação.
export function assertOnlinePaymentReleaseReady(
	environment: ReturnType<typeof getMercadoPagoConfig>['environment'],
): void {
	const clerk = getClerkEnvironment();
	const production = environment === 'production';
	if (
		process.env.NODE_ENV !== (production ? 'production' : 'development') ||
		clerk !== (production ? 'production' : 'development')
	) {
		throw new Error('Ambientes de execução incompatíveis com a criação de pagamentos.');
	}
	if (production && process.env.MERCADO_PAGO_PRODUCTION_RELEASE_READY !== 'true') {
		throw new Error('Liberação de pagamentos reais não autorizada.');
	}
	const suffix = production ? 'live_' : 'test_';
	const publicKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
	const secretKey = process.env.CLERK_SECRET_KEY;
	if (
		!publicKey?.startsWith(`pk_${suffix}`) ||
		publicKey.length <= `pk_${suffix}`.length ||
		!secretKey?.startsWith(`sk_${suffix}`) ||
		secretKey.length <= `sk_${suffix}`.length
	) {
		throw new Error('Credenciais Clerk incompatíveis com o ambiente.');
	}
	if (production && !process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY?.startsWith('APP_USR-')) {
		throw new Error('Public Key Mercado Pago de produção incompatível.');
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
	if (config.environment === 'test') await assertMercadoPagoTestCollector(config);
	else await assertMercadoPagoProductionCollector(config);
	const statementDescriptor = readStatementDescriptor();
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
					.select({ email: usersTable.email, name: usersTable.name })
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
					payerName: user.name,
					statementDescriptor,
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

import 'server-only';
import { db } from '@/db';
import { appointmentChargesTable, appointmentsTable, chargePaymentsTable } from '@/db/schema';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { buildAppointmentAccessCondition } from '@/lib/security/appointment-access';
import { calculateChargeBalance } from '@/lib/finance/ledger';
import { getStaffOnlinePaymentAttempts } from '@/lib/finance/staff-online-payment-queries';
import type { StaffOnlinePaymentAttempt } from '@/lib/finance/staff-online-payment';
import { and, inArray } from 'drizzle-orm';

// Retorna apenas cobranças de atendimentos autorizados; evita exposição cruzada entre veterinárias.
export async function getBillingOverviews(appointmentIds: string[]) {
	const context = await requireAuthContext();
	requireStaff(context);
	if (appointmentIds.length > 100) throw new Error('Quantidade de atendimentos excede o limite');
	if (!appointmentIds.length) return {} as Record<string, BillingOverview>;
	const permittedAppointments = await db
		.select({ id: appointmentsTable.id })
		.from(appointmentsTable)
		.where(and(inArray(appointmentsTable.id, appointmentIds), buildAppointmentAccessCondition(context)));
	const ids = permittedAppointments.map((item) => item.id);
	if (!ids.length) return {} as Record<string, BillingOverview>;
	const charges = await db
		.select()
		.from(appointmentChargesTable)
		.where(inArray(appointmentChargesTable.appointmentId, ids));
	const payments = charges.length
		? await db
				.select()
				.from(chargePaymentsTable)
				.where(
					inArray(
						chargePaymentsTable.chargeId,
						charges.map((item) => item.id),
					),
				)
		: [];
	const attempts = await getStaffOnlinePaymentAttempts(
		context,
		charges.map((charge) => charge.id),
	);
	const result: Record<string, BillingOverview> = {};
	for (const charge of charges) {
		const chargePayments = payments.filter((item) => item.chargeId === charge.id);
		result[charge.appointmentId] = {
			id: charge.id,
			customerId: charge.customerId,
			...calculateChargeBalance(charge.totalInCents, chargePayments, charge.status === 'void'),
			payments: chargePayments.map((p) => ({
				id: p.id,
				amountInCents: p.amountInCents,
				method: p.method,
				source: p.source,
				receivedAt: p.receivedAt.toISOString(),
			})),
			onlineAttempts: attempts.filter((attempt) => attempt.chargeId === charge.id),
		};
	}
	return result;
}
export type BillingOverview = {
	id: string;
	customerId: string;
	totalInCents: number;
	paidInCents: number;
	balanceInCents: number;
	status: 'pending' | 'partial' | 'paid' | 'void';
	payments: { id: string; amountInCents: number; method: string; source: string; receivedAt: string }[];
	onlineAttempts: StaffOnlinePaymentAttempt[];
};

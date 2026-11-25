import { appointmentChargesTable } from '@/db/schema';
import { buildAppointmentAccessCondition } from '@/lib/security/appointment-access';
import type { AuthContext } from '@/lib/security/auth-context';
import { and, eq } from 'drizzle-orm';

/** Identidade do tutor autenticado, não a titularidade de uma cobrança. */
export function requireFinancialTutorId(context: AuthContext): string {
	if (context.role !== 'customer' || !context.customerId) {
		throw new Error('Perfil de tutor não autorizado para o financeiro.');
	}
	return context.customerId;
}

/** Consultas com JOIN entre appointment_charges e appointments.
 * Tutor: vínculo atual com o pet (inclusive cobranças emitidas para cotutores).
 * Equipe: escopo de atendimento e filtro opcional pelo titular da cobrança.
 */
export function buildFinancialAccessCondition(context: AuthContext, customerId?: string) {
	if (context.role === 'customer') {
		requireFinancialTutorId(context);
		if (customerId !== undefined) {
			throw new Error('Filtro por titular da cobrança exclusivo da equipe.');
		}
		return buildAppointmentAccessCondition(context);
	}
	return and(
		buildAppointmentAccessCondition(context),
		customerId === undefined ? undefined : eq(appointmentChargesTable.customerId, customerId),
	);
}

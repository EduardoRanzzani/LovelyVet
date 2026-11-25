import { db } from '@/db';
import { appointmentsTable, petTutorsTable } from '@/db/schema';
import { and, eq, exists, sql, type SQL } from 'drizzle-orm';
import type { AuthContext } from './auth-context';

type AppointmentAccessColumns = {
	id: typeof appointmentsTable.id;
	petId: typeof appointmentsTable.petId;
	doctorId: typeof appointmentsTable.doctorId;
};

export const buildAppointmentAccessCondition = (
	context: AuthContext,
	appointmentId?: string,
	columns: AppointmentAccessColumns = appointmentsTable,
): SQL | undefined => {
	const conditions: SQL[] = [];

	if (appointmentId) {
		conditions.push(eq(columns.id, appointmentId));
	}

	if (context.role === 'doctor') {
		if (!context.doctorId) {
			throw new Error('Perfil de veterinário não encontrado');
		}
		conditions.push(eq(columns.doctorId, context.doctorId));
	}

	if (context.role === 'customer') {
		if (!context.customerId) {
			throw new Error('Perfil de cliente não encontrado');
		}

		conditions.push(
			exists(
				db
					.select({ petId: petTutorsTable.petId })
					.from(petTutorsTable)
					.where(
						and(eq(petTutorsTable.petId, columns.petId), eq(petTutorsTable.customerId, context.customerId)),
					),
			),
		);
	}

	return conditions.length ? and(...conditions) : undefined;
};

export const requireAccessibleAppointment = async (
	context: AuthContext,
	appointmentId: string,
	reader: Pick<typeof db, 'query'> = db,
) => {
	const appointment = await reader.query.appointmentsTable.findFirst({
		columns: { id: true, petId: true, status: true },
		where: (appointments) => buildAppointmentAccessCondition(context, appointmentId, appointments),
	});

	if (!appointment) {
		throw new Error('Agendamento não encontrado');
	}

	return appointment;
};

export type AppointmentTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Mantém o vínculo do tutor estável até o fim da transação.
export async function lockPetTutorAccess(tx: AppointmentTransaction, context: AuthContext, petId: string) {
	if (context.role !== 'customer') return true;
	if (!context.customerId) throw new Error('Perfil de cliente não encontrado');
	const result = await tx.execute(sql`SELECT pet_id FROM pet_tutors
		WHERE pet_id = ${petId} AND customer_id = ${context.customerId} FOR SHARE`);
	return result.rows.length === 1;
}

export async function lockAccessibleAppointment(tx: AppointmentTransaction, context: AuthContext, id: string) {
	await tx.execute(sql`SELECT id FROM appointments WHERE id = ${id} FOR UPDATE`);
	const appointment = await requireAccessibleAppointment(context, id, tx);
	if (context.role === 'customer') {
		if (!(await lockPetTutorAccess(tx, context, appointment.petId))) {
			throw new Error('Agendamento não encontrado');
		}
		// Se o vínculo foi removido enquanto aguardávamos a trava, negar a operação.
		return requireAccessibleAppointment(context, id, tx);
	}
	return appointment;
}

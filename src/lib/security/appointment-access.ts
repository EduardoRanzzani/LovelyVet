import { db } from '@/db';
import { appointmentsTable, petTutorsTable } from '@/db/schema';
import { and, eq, exists, type SQL } from 'drizzle-orm';
import type { AuthContext } from './auth-context';

type AppointmentAccessColumns = {
	id: typeof appointmentsTable.id;
	petId: typeof appointmentsTable.petId;
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

	if (context.role === 'customer') {
		if (!context.customerId) {
			throw new Error('Perfil de cliente não encontrado');
		}

		conditions.push(
			exists(
				db
					.select({
						petId: petTutorsTable.petId,
					})
					.from(petTutorsTable)
					.where(
						and(
							eq(petTutorsTable.petId, columns.petId),
							eq(petTutorsTable.customerId, context.customerId),
						),
					),
			),
		);
	}

	return conditions.length ? and(...conditions) : undefined;
};

export const requireAccessibleAppointment = async (
	context: AuthContext,
	appointmentId: string,
) => {
	const appointment = await db.query.appointmentsTable.findFirst({
		columns: {
			id: true,
			petId: true,
			status: true,
		},
		where: (appointments) =>
			buildAppointmentAccessCondition(context, appointmentId, appointments),
	});

	if (!appointment) {
		throw new Error('Agendamento não encontrado');
	}

	return appointment;
};

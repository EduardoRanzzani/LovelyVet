import { db } from '@/db';
import { careRemindersTable, petTutorsTable } from '@/db/schema';
import { and, eq, exists, type SQL } from 'drizzle-orm';
import type { AuthContext } from './auth-context';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

/** Limita consultas de lembretes ao veterinário ou aos pets do tutor autenticado. */
type CareReminderColumns = {
	petId: AnyPgColumn;
	doctorId: AnyPgColumn;
};

export const buildCareReminderAccessCondition = (
	context: AuthContext,
	columns: CareReminderColumns = careRemindersTable,
): SQL | undefined => {
	if (context.role === 'admin') return undefined;

	if (context.role === 'doctor') {
		if (!context.doctorId) {
			throw new Error('Perfil de veterinário não encontrado');
		}

		return eq(columns.doctorId, context.doctorId);
	}

	if (context.role === 'customer') {
		if (!context.customerId) {
			throw new Error('Perfil de cliente não encontrado');
		}

		return exists(
			db
				.select({ petId: petTutorsTable.petId })
				.from(petTutorsTable)
				.where(
					and(
						eq(petTutorsTable.petId, columns.petId),
						eq(petTutorsTable.customerId, context.customerId),
					),
				),
		);
	}

	throw new Error('Perfil não autorizado');
};

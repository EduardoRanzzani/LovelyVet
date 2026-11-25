import { db } from '@/db';
import { customersTable, petsTable, petTutorsTable, usersTable } from '@/db/schema';
import { and, eq, ilike, inArray } from 'drizzle-orm';
import type { AuthContext } from './auth-context';

/** O filtro de busca não pode revelar tutores ocultos na resposta. */
export const buildPetTutorSearchCondition = (context: AuthContext, term: string) => {
	const customerId = context.role === 'customer' ? context.customerId : null;
	if (context.role === 'customer' && !customerId) {
		throw new Error('Perfil de cliente não encontrado');
	}

	return inArray(
		petsTable.id,
		db
			.select({ petId: petTutorsTable.petId })
			.from(petTutorsTable)
			.innerJoin(customersTable, eq(petTutorsTable.customerId, customersTable.id))
			.innerJoin(usersTable, eq(customersTable.userId, usersTable.id))
			.where(
				and(ilike(usersTable.name, term), customerId ? eq(petTutorsTable.customerId, customerId) : undefined),
			),
	);
};

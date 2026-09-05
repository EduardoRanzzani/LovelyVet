import { db } from '@/db';
import { petsTable, petTutorsTable } from '@/db/schema';
import { and, eq, inArray, type SQL } from 'drizzle-orm';
import type { AuthContext } from './auth-context';

export const buildPetAccessCondition = (
	context: AuthContext,
	petId?: string,
): SQL | undefined => {
	if (context.role !== 'customer') {
		return petId ? eq(petsTable.id, petId) : undefined;
	}

	if (!context.customerId) {
		throw new Error('Perfil de cliente não encontrado');
	}

	const ownershipCondition = inArray(
		petsTable.id,
		db
			.select({ petId: petTutorsTable.petId })
			.from(petTutorsTable)
			.where(eq(petTutorsTable.customerId, context.customerId)),
	);

	if (!petId) {
		return ownershipCondition;
	}

	return and(eq(petsTable.id, petId), ownershipCondition);
};

export const assertCanAccessPet = async (
	context: AuthContext,
	petId: string,
): Promise<void> => {
	const pet = await db.query.petsTable.findFirst({
		columns: {
			id: true,
		},
		where: buildPetAccessCondition(context, petId),
	});

	if (!pet) {
		throw new Error('Pet não encontrado');
	}
};

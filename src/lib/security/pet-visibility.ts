import type { PetsWithRelations } from '@/api/schema/pets.schema';
import type { AuthContext } from './auth-context';

export const filterPetForViewer = (
	context: AuthContext,
	pet: PetsWithRelations,
): PetsWithRelations => {
	if (context.role !== 'customer') {
		return pet;
	}

	return {
		...pet,
		// Observações internas nunca devem chegar ao customer.
		notes: [],
		// Em pets com múltiplos tutores, o customer só recebe
		// o próprio cadastro.
		petTutors: pet.petTutors.filter(
			({ tutor }) => tutor.id === context.customerId,
		),
	};
};

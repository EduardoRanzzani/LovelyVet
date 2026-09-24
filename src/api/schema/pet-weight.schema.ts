import {
	breedsTable,
	customersTable,
	petsTable,
	petWeightsTable,
	speciesTable,
	usersTable,
} from '@/db/schema';
import z from 'zod';

export type PetWeight = typeof petWeightsTable.$inferSelect;

export type PetWeightWithRelations = typeof petWeightsTable.$inferSelect & {
	pet: typeof petsTable.$inferSelect & {
		breed: typeof breedsTable.$inferSelect & {
			specie: typeof speciesTable.$inferSelect;
		};
		petTutors: {
			tutor: typeof customersTable.$inferSelect & {
				user: typeof usersTable.$inferSelect;
			};
		}[];
	};
};

export const createPetWeightSchema = z.object({
	petId: z.uuid({ message: 'O paciente é obrigatório' }),
	weightInGrams: z.number({ message: 'O campo peso é obrigatório' }),
});

export type CreatePetWeightSchema = z.infer<typeof createPetWeightSchema>;

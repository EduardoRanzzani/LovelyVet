import {
	appointmentItemsTable,
	appointmentsTable,
	breedsTable,
	customersTable,
	doctorsTable,
	medicalRecordsTable,
	pathologiesTable,
	petAttachmentsTable,
	petNotesTable,
	petWeightsTable,
	petsTable,
	prescriptionsTable,
	servicesTable,
	speciesTable,
	usersTable,
	vaccinesTable,
} from '@/db/schema';
import z from 'zod';

export type PetTutorLink = {
	tutor: typeof customersTable.$inferSelect & {
		user: typeof usersTable.$inferSelect;
	};
};

export type PetsWithRelations = typeof petsTable.$inferSelect & {
	breed: typeof breedsTable.$inferSelect & {
		specie: typeof speciesTable.$inferSelect;
	};
	petTutors: PetTutorLink[];
	medicalRecords?: (typeof medicalRecordsTable.$inferSelect & {
		doctor: typeof doctorsTable.$inferSelect & {
			user: typeof usersTable.$inferSelect;
		};
	})[];
	appointments?: (typeof appointmentsTable.$inferSelect & {
		doctor: typeof doctorsTable.$inferSelect & {
			user: typeof usersTable.$inferSelect;
		};
		items: (typeof appointmentItemsTable.$inferSelect & {
			service: typeof servicesTable.$inferSelect;
		})[];
	})[];
	weightHistory?: (typeof petWeightsTable.$inferSelect & {
		author?: typeof usersTable.$inferSelect;
	})[];
	vaccines?: (typeof vaccinesTable.$inferSelect & {
		doctor: typeof doctorsTable.$inferSelect & {
			user: typeof usersTable.$inferSelect;
		};
	})[];
	pathologies?: (typeof pathologiesTable.$inferSelect & {
		doctor: typeof doctorsTable.$inferSelect & {
			user: typeof usersTable.$inferSelect;
		};
	})[];
	attachments?: (typeof petAttachmentsTable.$inferSelect & {
		author: typeof usersTable.$inferSelect;
	})[];
	// CORREÇÃO: No schema, a relação se chama 'author'
	notes?: (typeof petNotesTable.$inferSelect & {
		author: typeof usersTable.$inferSelect;
	})[];
	prescriptions?: (typeof prescriptionsTable.$inferSelect & {
		doctor: typeof doctorsTable.$inferSelect & {
			user: typeof usersTable.$inferSelect;
		};
	})[];
	weightInGrams?: number;
};

/** Nomes dos tutores para exibição (pet carregado com `petTutors.tutor.user`). */
type PetWithTutorNames = {
	petTutors: {
		tutor: {
			user: {
				name: string;
			};
		};
	}[];
};

export function formatPetTutorNames(pet: PetWithTutorNames): string {
	return (
		pet.petTutors
			?.map((pt) => pt.tutor.user.name)
			.filter(Boolean)
			.join(', ') ?? ''
	);
}

export const createPetWithTutorAndBreedSchema = z.object({
	id: z.uuid().optional().nullable(), // uuid() do zod costuma ser .string().uuid()
	name: z.string().min(1, { message: 'Nome é obrigatório' }),
	birthDate: z.date({ message: 'Data de nascimento é obrigatória' }),
	breedId: z.uuid({ message: 'Raça inválida' }),
	specieId: z.uuid({ message: 'Espécie inválida' }),
	customerIds: z
		.array(z.uuid({ message: 'Tutor inválido' }))
		.min(1, { message: 'Selecione pelo menos um tutor' }),
	color: z.string().min(1, { message: 'Pelagem é obrigatória' }),
	gender: z.enum(['male', 'female'], { message: 'Selecione uma das opções' }), // Removido .default()
	sterile: z.boolean({ message: 'Selecione uma das opções' }), // Removido .default()
	status: z.enum(['alive', 'dead', 'missing']), // Removido .default()
	weightInGrams: z.number(),
	photo: z.string().optional().nullable(),
});

export type CreatePetWithTutorAndBreedSchema = z.infer<
	typeof createPetWithTutorAndBreedSchema
>;

export type PetOption = {
	id: string;
	name: string;
	breed: {
		specieId: string;
	};
	petTutors: {
		tutor: {
			user: {
				name: string;
			};
		};
	}[];
};

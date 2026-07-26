import {
	breedsTable,
	doctorsTable,
	petsTable,
	petWeightsTable,
	prescriptionsTable,
	speciesTable,
	usersTable,
} from '@/db/schema';
import z from 'zod';

export type PrescriptionsWithRelations =
	typeof prescriptionsTable.$inferSelect & {
		doctor: typeof doctorsTable.$inferSelect & {
			user: typeof usersTable.$inferSelect;
		};
		pet: typeof petsTable.$inferSelect & {
			breed: typeof breedsTable.$inferSelect & {
				specie: typeof speciesTable.$inferSelect;
			};
			weightHistory?: (typeof petWeightsTable.$inferSelect & {
				author?: typeof usersTable.$inferSelect;
			})[];
		};
	};

export const createPrescriptionSchema = z.object({
	id: z.uuid().optional(),
	petId: z.string().uuid({ message: 'ID do pet é obrigatório' }),
	doctorId: z.string().uuid({ message: 'ID do veterinário é obrigatório' }),
	prescriptionItemsIds: z.array(z.string().uuid()).min(1, {
		message: 'Selecione ao menos um item de receita',
	}),
	appointmentId: z.string().uuid().optional().nullable(),
	customContent: z.string().optional(),
});

export type CreatePrescriptionSchema = z.infer<typeof createPrescriptionSchema>;

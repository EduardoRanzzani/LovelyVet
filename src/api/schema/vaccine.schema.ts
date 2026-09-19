import {
	breedsTable,
	customersTable,
	petsTable,
	speciesTable,
	usersTable,
	vaccinesTable,
} from '@/db/schema';
import z from 'zod';

export type VaccinesWithRelations = typeof vaccinesTable.$inferSelect & {
	pet: typeof petsTable.$inferSelect & {
		breed: typeof breedsTable.$inferSelect & {
			specie: typeof speciesTable.$inferSelect;
		};
		petTutors: {
			tutor: typeof customersTable.$inferSelect & {
				user: typeof usersTable.$inferSelect;
			};
		}[];
		doctor: typeof usersTable.$inferSelect & {
			user: typeof usersTable.$inferSelect;
		};
	};
};

export const createVaccineSchema = z
	.object({
		id: z.uuid().optional().nullable(),
		petId: z.uuid({ message: 'Favor informar o pet' }),
		name: z
			.string({ message: 'Favor informar o nome da vacina' })
			.nonempty({ message: 'Favor informar o nome da Vacina' }),
		applicationDate: z.date({ message: 'Favor informar a data da aplicação' }),
		nextDoseType: z.enum(['booster', 'annual', 'none'], {
			message: 'Informe o tipo da próxima dose',
		}),
		daysToNextDose: z.coerce
			.number()
			.int()
			.positive('Informe os dias para a próxima dose')
			.optional(),
		lotNumber: z
			.string({ message: 'Favor informar o número do lote' })
			.optional(),
		manufacturer: z
			.string({ message: 'Favor informar o fabricante' })
			.optional(),
		doctorId: z.uuid({ message: 'Favor informar o veterinário' }),
	})
	.superRefine((data, ctx) => {
		if (data.nextDoseType === 'booster' && !data.daysToNextDose) {
			ctx.addIssue({
				code: 'custom',
				path: ['daysToNextDose'],
				message: 'Informe os dias para a próxima dose',
			});
		}
	});

export type CreateVaccineSchema = z.infer<typeof createVaccineSchema>;

import { servicesTable, speciesTable } from '@/db/schema';
import z from 'zod';

export type ServicesWithRelations = typeof servicesTable.$inferSelect & {
	specie: typeof speciesTable.$inferSelect;
};

export const createServiceSchema = z.object({
	id: z.uuid().optional().nullable(),
	name: z.string().nonempty({ message: 'Nome é obrigatório' }),
	description: z.string().optional().nullable(),
	specieId: z.string().optional().nullable(),
	price: z
		.number({ message: 'Preço é obrigatório' })
		.finite({ message: 'Preço inválido' })
		.positive({ message: 'O preço deve ser maior que zero' }),
});

export type CreateServiceSchema = z.infer<typeof createServiceSchema>;

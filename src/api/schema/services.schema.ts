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
	price: z.number().min(1, { message: 'Preço é obrigatório' }),
});

export type CreateServiceSchema = z.infer<typeof createServiceSchema>;
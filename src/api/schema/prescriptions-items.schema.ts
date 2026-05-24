import { prescriptionItemsTable } from '@/db/schema';
import z from 'zod';

export type PrescriptionItemsWithRelations =
	typeof prescriptionItemsTable.$inferSelect;

export const createPrescriptionItemSchema = z.object({
	id: z.uuid().optional().nullable(),
	name: z.string().nonempty({ message: 'Nome da mediação é obrigatório' }),
	pharmacy: z.string().nonempty({ message: 'Farmácia é obrigatório' }),
	quantity: z.string().nonempty({ message: 'Quantidade é obrigatório' }),
	orientations: z.string().nonempty({ message: 'Orientações é obrigatório' }),
});

export type CreatePrescriptionItemSchema = z.infer<
	typeof createPrescriptionItemSchema
>;

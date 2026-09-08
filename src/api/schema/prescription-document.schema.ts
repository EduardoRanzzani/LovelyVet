import { z } from 'zod';

export const prescriptionDocumentItemSchema = z.object({
	sourceId: z.string().uuid().nullable(),
	name: z.string().trim().min(1),
	pharmacy: z.string().trim(),
	quantity: z.string().trim().min(1),
	orientations: z.string().min(1),
});

export const prescriptionDocumentDataSchema = z.object({
	tutor: z.object({
		id: z.string().uuid(),
		name: z.string(),
	}),
	patient: z.object({
		name: z.string(),
		species: z.string(),
		breed: z.string(),
		age: z.string(),
		weight: z.string(),
		sex: z.string(),
	}),
	administrationRoute: z.string(),
	items: z.array(prescriptionDocumentItemSchema),
});

export type PrescriptionDocumentItem = z.infer<
	typeof prescriptionDocumentItemSchema
>;

export type PrescriptionDocumentData = z.infer<
	typeof prescriptionDocumentDataSchema
>;

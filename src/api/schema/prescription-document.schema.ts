import { z } from 'zod';

export const prescriptionDocumentItemSchema = z.object({
	sourceId: z.string().uuid().nullable(),
	name: z.string().trim().min(1),
	pharmacy: z.string().trim(),
	quantity: z.string().trim().min(1),
	orientations: z.string().min(1),
});

export const prescriptionDocumentGroupSchema = z.object({
	administrationRoute: z.string().trim().min(1, 'Informe o modo de uso'),

	items: z
		.array(prescriptionDocumentItemSchema)
		.min(1, 'Adicione pelo menos um medicamento'),
});

export const prescriptionOrientationBlockSchema = z.object({
	content: z.string().trim().min(1, 'Preencha as orientações'),
});

/*
 * groups é o formato atual.
 *
 * administrationRoute/items permanecem opcionais apenas para
 * compatibilidade com receitas antigas já armazenadas no JSONB.
 */
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
	isControlled: z.boolean().optional(),
	generalOrientations: z.string().max(2000).optional(),
	groups: z.array(prescriptionDocumentGroupSchema).optional(),
	orientationBlocks: z.array(prescriptionOrientationBlockSchema).optional(),
	// Formato legado
	administrationRoute: z.string().optional(),
	items: z.array(prescriptionDocumentItemSchema).optional(),
});

export type PrescriptionDocumentItem = z.infer<
	typeof prescriptionDocumentItemSchema
>;

export type PrescriptionDocumentGroup = z.infer<
	typeof prescriptionDocumentGroupSchema
>;

export type PrescriptionOrientationBlock = z.infer<
	typeof prescriptionOrientationBlockSchema
>;

export type PrescriptionDocumentData = z.infer<
	typeof prescriptionDocumentDataSchema
>;

export const savePrescriptionDocumentSchema = z.object({
	petId: z.uuid(),
	tutorId: z.uuid(),
	doctorId: z.uuid(),
	isControlled: z.boolean().default(false),
	orientationBlocks: z.array(prescriptionOrientationBlockSchema).default([]),
	generalOrientations: z
		.string()
		.max(2000, 'As orientações devem ter no máximo 2.000 caracteres')
		.optional(),
	groups: z
		.array(prescriptionDocumentGroupSchema)
		.min(1, 'Adicione pelo menos um modo de uso'),
});

export type SavePrescriptionDocumentSchema = z.infer<
	typeof savePrescriptionDocumentSchema
>;

export const updatePrescriptionDocumentSchema =
	savePrescriptionDocumentSchema.extend({
		prescriptionId: z.uuid(),
	});

export type UpdatePrescriptionDocumentSchema = z.infer<
	typeof updatePrescriptionDocumentSchema
>;

export const signPrescriptionDocumentSchema = z.object({
	prescriptionId: z.uuid(),
});

export type SignPrescriptionDocumentSchema = z.infer<
	typeof signPrescriptionDocumentSchema
>;

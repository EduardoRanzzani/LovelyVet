import { z } from 'zod';

export const clinicalDocumentTypeSchema = z.enum(['referral', 'exam_request']);

export const clinicalDocumentSnapshotSchema = z.object({
	tutor: z.object({
		id: z.uuid(),
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
});

export const saveClinicalDocumentSchema = z.object({
	petId: z.uuid(),
	tutorId: z.uuid(),
	doctorId: z.uuid(),
	type: clinicalDocumentTypeSchema,
	content: z.string().min(1, 'Digite o conteúdo do documento'),
});

export type ClinicalDocumentType = z.infer<typeof clinicalDocumentTypeSchema>;

export type ClinicalDocumentSnapshot = z.infer<
	typeof clinicalDocumentSnapshotSchema
>;

export type SaveClinicalDocument = z.infer<typeof saveClinicalDocumentSchema>;

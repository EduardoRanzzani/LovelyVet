'use server';

import { db } from '@/db';
import {
	clinicalDocumentsTable,
	petNotesTable,
	petWeightsTable,
	prescriptionsTable,
	vaccinesTable,
} from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { deleteTimelineItemSchema } from '../schema/timeline.schema';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { assertPrescriptionIsUnsigned } from '@/lib/prescriptions/prescription-signature';

export const deleteTimelineItem = actionClient
	.schema(deleteTimelineItemSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireStaff(context);

		const { id, petId, type } = parsedInput;

		switch (type) {
			case 'vaccine': {
				const vaccine = await db.query.vaccinesTable.findFirst({
					where: and(eq(vaccinesTable.id, id), eq(vaccinesTable.petId, petId)),
				});

				if (!vaccine) {
					throw new Error('Vacina não encontrada');
				}

				await db
					.delete(vaccinesTable)
					.where(and(eq(vaccinesTable.id, id), eq(vaccinesTable.petId, petId)));

				break;
			}

			case 'weight': {
				const weight = await db.query.petWeightsTable.findFirst({
					where: and(
						eq(petWeightsTable.id, id),
						eq(petWeightsTable.petId, petId),
					),
				});

				if (!weight) {
					throw new Error('Peso não encontrado');
				}

				await db
					.delete(petWeightsTable)
					.where(
						and(eq(petWeightsTable.id, id), eq(petWeightsTable.petId, petId)),
					);

				break;
			}

			case 'note': {
				const note = await db.query.petNotesTable.findFirst({
					where: and(eq(petNotesTable.id, id), eq(petNotesTable.petId, petId)),
				});

				if (!note) {
					throw new Error('Observação não encontrada');
				}

				await db
					.delete(petNotesTable)
					.where(and(eq(petNotesTable.id, id), eq(petNotesTable.petId, petId)));

				break;
			}

			case 'prescription': {
				const prescription = await db.query.prescriptionsTable.findFirst({
					where: and(
						eq(prescriptionsTable.id, id),
						eq(prescriptionsTable.petId, petId),
					),
				});

				if (!prescription) {
					throw new Error('Prescrição não encontrada');
				}

				await assertPrescriptionIsUnsigned(prescription.id);

				await db
					.delete(prescriptionsTable)
					.where(
						and(
							eq(prescriptionsTable.id, id),
							eq(prescriptionsTable.petId, petId),
						),
					);

				break;
			}

			case 'referral':
			case 'exam_request': {
				const document = await db.query.clinicalDocumentsTable.findFirst({
					where: and(
						eq(clinicalDocumentsTable.id, id),
						eq(clinicalDocumentsTable.petId, petId),
						eq(clinicalDocumentsTable.type, type),
					),
				});

				if (!document) {
					throw new Error('Documento clínico não encontrado');
				}

				await db
					.delete(clinicalDocumentsTable)
					.where(
						and(
							eq(clinicalDocumentsTable.id, id),
							eq(clinicalDocumentsTable.petId, petId),
							eq(clinicalDocumentsTable.type, type),
						),
					);

				break;
			}
		}

		revalidatePath(`/pets/${petId}`);
	});

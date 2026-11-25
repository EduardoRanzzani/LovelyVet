'use server';

import { db } from '@/db';
import {
	careRemindersTable,
	clinicalDocumentsTable,
	petNotesTable,
	petWeightsTable,
	prescriptionsTable,
	prescriptionSignaturesTable,
	vaccinesTable,
} from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { deleteTimelineItemSchema } from '../schema/timeline.schema';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';

export const deleteTimelineItem = actionClient.schema(deleteTimelineItemSchema).action(async ({ parsedInput }) => {
	const context = await requireAuthContext();
	// Política compartilhada: Admin e Doctor podem excluir registros elegíveis de qualquer profissional.
	requireStaff(context);

	const { id, petId, type } = parsedInput;

	switch (type) {
		case 'vaccine': {
			await db.transaction(async (tx) => {
				const scope = and(eq(vaccinesTable.id, id), eq(vaccinesTable.petId, petId));
				const [vaccine] = await tx
					.select({ id: vaccinesTable.id, appointmentId: vaccinesTable.appointmentId })
					.from(vaccinesTable)
					.where(scope)
					.for('update');

				if (!vaccine) {
					throw new Error('Vacina não encontrada');
				}
				if (vaccine.appointmentId) {
					throw new Error(
						'Vacina vinculada a atendimento: revise o atendimento antes de excluir o registro clínico.',
					);
				}

				// Exclui os lembretes de qualquer status na mesma transação da vacina.
				await tx
					.delete(careRemindersTable)
					.where(and(eq(careRemindersTable.sourceVaccineId, id), eq(careRemindersTable.petId, petId)));

				const [deleted] = await tx
					.delete(vaccinesTable)
					.where(and(scope, isNull(vaccinesTable.appointmentId)))
					.returning({ id: vaccinesTable.id });
				if (!deleted) {
					throw new Error('Vacina não encontrada ou vinculada a atendimento');
				}
			});
			break;
		}

		case 'weight': {
			const [deleted] = await db
				.delete(petWeightsTable)
				.where(and(eq(petWeightsTable.id, id), eq(petWeightsTable.petId, petId)))
				.returning({ id: petWeightsTable.id });
			if (!deleted) {
				throw new Error('Peso não encontrado');
			}
			break;
		}

		case 'note': {
			const [deleted] = await db
				.delete(petNotesTable)
				.where(and(eq(petNotesTable.id, id), eq(petNotesTable.petId, petId)))
				.returning({ id: petNotesTable.id });
			if (!deleted) {
				throw new Error('Observação não encontrada');
			}
			break;
		}

		case 'prescription': {
			await db.transaction(async (tx) => {
				const scope = and(eq(prescriptionsTable.id, id), eq(prescriptionsTable.petId, petId));
				// A assinatura digital bloqueia a mesma linha antes de criar a assinatura.
				const [prescription] = await tx
					.select({ id: prescriptionsTable.id })
					.from(prescriptionsTable)
					.where(scope)
					.for('update');
				if (!prescription) {
					throw new Error('Prescrição não encontrada');
				}

				const signature = await tx.query.prescriptionSignaturesTable.findFirst({
					where: eq(prescriptionSignaturesTable.prescriptionId, prescription.id),
					columns: { id: true },
				});
				if (signature) {
					throw new Error('Esta receita foi assinada digitalmente e não pode mais ser alterada.');
				}

				const [deleted] = await tx
					.delete(prescriptionsTable)
					.where(scope)
					.returning({ id: prescriptionsTable.id });
				if (!deleted) {
					throw new Error('Prescrição não encontrada');
				}
			});
			break;
		}

		case 'referral':
		case 'exam_request': {
			const [deleted] = await db
				.delete(clinicalDocumentsTable)
				.where(
					and(
						eq(clinicalDocumentsTable.id, id),
						eq(clinicalDocumentsTable.petId, petId),
						eq(clinicalDocumentsTable.type, type),
					),
				)
				.returning({ id: clinicalDocumentsTable.id });
			if (!deleted) {
				throw new Error('Documento clínico não encontrado');
			}
			break;
		}
	}

	revalidatePath(`/pets/${petId}`);
	revalidatePath('/agenda');
	revalidatePath('/dashboard');
});

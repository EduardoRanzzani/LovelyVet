'use server';

import { db } from '@/db';
import {
	petNotesTable,
	petWeightsTable,
	prescriptionsTable,
	vaccinesTable,
} from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { timelineItemSchema } from '../schema/timeline.schema';

export const deleteTimelineItem = actionClient
	.schema(timelineItemSchema)
	.action(async ({ parsedInput }) => {
		const authenticatedUser = await currentUser();
		if (!authenticatedUser) throw new Error('Usuário não autenticado');

		const { id, petId, type } = parsedInput;

		switch (type) {
			case 'vaccine':
				const vaccine = await db.query.vaccinesTable.findFirst({
					where: eq(vaccinesTable.id, id),
				});
				if (!vaccine) {
					throw new Error('Vacina não encontrada');
				}
				await db.delete(vaccinesTable).where(eq(vaccinesTable.id, id));
				break;
			case 'weight':
				const weight = await db.query.petWeightsTable.findFirst({
					where: eq(petWeightsTable.id, id),
				});
				if (!weight) {
					throw new Error('Peso não encontrado');
				}
				await db.delete(petWeightsTable).where(eq(petWeightsTable.id, id));
				break;
			case 'note':
				const note = await db.query.petNotesTable.findFirst({
					where: eq(petNotesTable.id, id),
				});
				if (!note) {
					throw new Error('Observação não encontrada');
				}
				await db.delete(petNotesTable).where(eq(petNotesTable.id, id));
				break;
			case 'prescription':
				const prescription = await db.query.prescriptionsTable.findFirst({
					where: eq(prescriptionsTable.id, id),
				});
				if (!prescription) {
					throw new Error('Prescrição não encontrada');
				}
				await db
					.delete(prescriptionsTable)
					.where(eq(prescriptionsTable.id, id));
				break;
		}

		revalidatePath(`/pets/${petId}`);
	});

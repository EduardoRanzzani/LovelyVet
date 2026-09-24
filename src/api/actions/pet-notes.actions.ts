'use server';

import { db } from '@/db';
import { petNotesTable } from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { assertCanAccessPet } from '@/lib/security/pet-access';
import { revalidatePath } from 'next/cache';
import { createNoteSchema } from '../schema/pet-notes.schema';

export const insertNote = actionClient
	.schema(createNoteSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();

		requireStaff(context);
		await assertCanAccessPet(context, parsedInput.petId);

		await db.insert(petNotesTable).values({
			petId: parsedInput.petId,
			content: parsedInput.content,
			authorId: context.userId,
			createdAt: new Date(),
		});

		revalidatePath(`/pets/${parsedInput.petId}`);
	});

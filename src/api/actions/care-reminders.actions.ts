'use server';

import { db } from '@/db';
import { careRemindersTable } from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const updateCareReminderStatusSchema = z.object({
	id: z.string().uuid(),
	status: z.enum(['completed', 'cancelled']),
});

export const updateCareReminderStatus = actionClient
	.schema(updateCareReminderStatusSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireStaff(context);

		const reminder = await db.query.careRemindersTable.findFirst({
			where: eq(careRemindersTable.id, parsedInput.id),
		});

		if (!reminder) {
			throw new Error('Lembrete não encontrado.');
		}

		if (context.role === 'doctor' && reminder.doctorId !== context.doctorId) {
			throw new Error('Você não possui permissão para alterar este lembrete.');
		}

		/*
		 * Repetir exatamente a mesma operação
		 * é tratado como idempotente.
		 */
		if (reminder.status === parsedInput.status) {
			return reminder;
		}

		/*
		 * Depois que um reminder sai de pending,
		 * mantemos esse estado como histórico.
		 */
		if (reminder.status !== 'pending') {
			throw new Error('Este lembrete já foi finalizado.');
		}

		const [updatedReminder] = await db
			.update(careRemindersTable)
			.set({
				status: parsedInput.status,
				completedAt: parsedInput.status === 'completed' ? new Date() : null,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(careRemindersTable.id, reminder.id),
					eq(careRemindersTable.status, 'pending'),
				),
			)
			.returning();

		if (!updatedReminder) {
			const currentReminder = await db.query.careRemindersTable.findFirst({
				where: eq(careRemindersTable.id, reminder.id),
			});

			if (currentReminder?.status === parsedInput.status) {
				return currentReminder;
			}

			throw new Error('Este lembrete já foi finalizado.');
		}

		revalidatePath('/agenda');
		revalidatePath(`/pets/${reminder.petId}`);
		return updatedReminder;
	});

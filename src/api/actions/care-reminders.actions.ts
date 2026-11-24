'use server';

import { db } from '@/db';
import { careRemindersTable } from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/** Reagenda somente a pendência; não altera a vacinação de origem. */
const rescheduleCareReminderSchema = z.object({
	id: z.uuid(),
	dueDate: z.iso.date(),
});

export const rescheduleCareReminder = actionClient
	.schema(rescheduleCareReminderSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireStaff(context);

		const reminder = await db.query.careRemindersTable.findFirst({
			where: eq(careRemindersTable.id, parsedInput.id),
			columns: { id: true, petId: true, doctorId: true, status: true, dueDate: true, appointmentId: true },
		});

		if (!reminder) {
			throw new Error('Lembrete não encontrado.');
		}
		if (context.role === 'doctor' && reminder.doctorId !== context.doctorId) {
			throw new Error('Você não possui permissão para alterar este lembrete.');
		}
		if (reminder.status !== 'pending') {
			throw new Error('Apenas lembretes pendentes podem ser reagendados.');
		}
		if (reminder.appointmentId) {
			throw new Error('Este retorno já possui atendimento. Reagende pelo atendimento.');
		}
		if (reminder.dueDate === parsedInput.dueDate) {
			return { success: true, dueDate: reminder.dueDate };
		}

		const [updated] = await db
			.update(careRemindersTable)
			.set({ dueDate: parsedInput.dueDate, updatedAt: new Date() })
			.where(
				and(
					eq(careRemindersTable.id, parsedInput.id),
					eq(careRemindersTable.doctorId, reminder.doctorId),
					eq(careRemindersTable.status, 'pending'),
					eq(careRemindersTable.dueDate, reminder.dueDate),
					isNull(careRemindersTable.appointmentId),
				),
			)
			.returning({ id: careRemindersTable.id, dueDate: careRemindersTable.dueDate });

		if (!updated) {
			throw new Error('Este lembrete foi alterado por outra operação. Atualize a página.');
		}

		revalidatePath('/agenda');
		revalidatePath('/appointments');
		revalidatePath('/dashboard');
		revalidatePath(`/pets/${reminder.petId}`);
		return { success: true, dueDate: updated.dueDate };
	});

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

		if (reminder.appointmentId && reminder.status === 'pending') {
			throw new Error('Este retorno já possui atendimento. Conclua ou cancele o atendimento primeiro.');
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

const deleteFinalizedCareReminderSchema = z.object({
	id: z.string().uuid(),
});

export const deleteFinalizedCareReminder = actionClient
	.schema(deleteFinalizedCareReminderSchema)
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
			throw new Error('Você não possui permissão para excluir este lembrete.');
		}

		if (reminder.status === 'pending') {
			throw new Error(
				'Lembretes pendentes não podem ser excluídos por esta ação.',
			);
		}

		const [deletedReminder] = await db
			.delete(careRemindersTable)
			.where(
				and(
					eq(careRemindersTable.id, reminder.id),
					eq(careRemindersTable.status, reminder.status),
				),
			)
			.returning({
				id: careRemindersTable.id,
			});

		if (!deletedReminder) {
			throw new Error(
				'O lembrete foi alterado ou excluído por outra operação.',
			);
		}

		revalidatePath('/agenda');
		revalidatePath(`/pets/${reminder.petId}`);
		revalidatePath('/dashboard');

		return { success: true };
	});

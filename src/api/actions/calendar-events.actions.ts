'use server';

import {
	appointmentsTable,
	calendarEventsTable,
	doctorsTable,
	shiftsTable,
} from '@/db/schema';
import { db } from '@/db';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import {
	and,
	eq,
	gt,
	gte,
	isNull,
	lt,
	ne,
	notInArray,
	or,
	sql,
} from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createCalendarEventSchema } from '../schema/calendar-event.schema';

export const upsertCalendarEvent = actionClient
	.schema(createCalendarEventSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();

		requireStaff(context);

		const { id, doctorId, title, startTime, endTime, notes } = parsedInput;

		/*
		 * Doctor só pode trabalhar com a própria agenda.
		 *
		 * Não ignoramos silenciosamente um doctorId diferente,
		 * pois isso esconderia uma tentativa de manipulação do payload.
		 */
		if (context.role === 'doctor' && doctorId !== context.doctorId) {
			throw new Error(
				'Você não possui permissão para alterar a agenda deste veterinário.',
			);
		}

		const result = await db.transaction(async (tx) => {
			const doctor = await tx.query.doctorsTable.findFirst({
				columns: {
					id: true,
				},
				where: eq(doctorsTable.id, doctorId),
			});

			if (!doctor) {
				throw new Error('Veterinário não encontrado.');
			}

			/*
			 * Se for edição, carregamos primeiro o evento original.
			 */
			const existingEvent = id
				? await tx.query.calendarEventsTable.findFirst({
						where: eq(calendarEventsTable.id, id),
					})
				: null;

			if (id && !existingEvent) {
				throw new Error('Compromisso não encontrado.');
			}

			/*
			 * Doctor não pode editar compromisso
			 * pertencente a outro veterinário.
			 */
			if (
				existingEvent &&
				context.role === 'doctor' &&
				existingEvent.doctorId !== context.doctorId
			) {
				throw new Error(
					'Você não possui permissão para alterar este compromisso.',
				);
			}

			/*
			 * Em edição por admin, o doctorId pode eventualmente
			 * mudar.
			 *
			 * Travamos a agenda antiga e a nova em ordem estável
			 * para não criar race condition nem deadlock.
			 */
			const doctorIdsToLock = Array.from(
				new Set(
					[doctorId, existingEvent?.doctorId].filter((value): value is string =>
						Boolean(value),
					),
				),
			).sort();

			for (const doctorIdToLock of doctorIdsToLock) {
				await tx.execute(sql`
					SELECT pg_advisory_xact_lock(
						hashtext('lovelyvet:doctor_schedule'),
						hashtext(${doctorIdToLock})
					)
				`);
			}

			/*
			 * ------------------------------------------------
			 * CONFLITO COM ATENDIMENTOS
			 * ------------------------------------------------
			 *
			 * start < requestedEnd
			 * &&
			 * end > requestedStart
			 *
			 * Para eventual registro legado com endsAt NULL,
			 * bloqueamos quando o início do appointment cai
			 * dentro do compromisso.
			 *
			 * Não inventamos duração para o dado legado.
			 */
			const appointmentConflict = await tx.query.appointmentsTable.findFirst({
				columns: {
					id: true,
				},
				where: and(
					eq(appointmentsTable.doctorId, doctorId),

					lt(appointmentsTable.scheduledAt, endTime),

					or(
						gt(appointmentsTable.endsAt, startTime),

						and(
							isNull(appointmentsTable.endsAt),
							gte(appointmentsTable.scheduledAt, startTime),
						),
					),

					notInArray(appointmentsTable.status, ['cancelled', 'no_show']),
				),
			});

			if (appointmentConflict) {
				throw new Error('Já existe um atendimento neste período.');
			}

			/*
			 * ------------------------------------------------
			 * CONFLITO COM PLANTÃO
			 * ------------------------------------------------
			 */
			const shiftConflict = await tx.query.shiftsTable.findFirst({
				columns: {
					id: true,
				},
				where: and(
					eq(shiftsTable.doctorId, doctorId),

					lt(shiftsTable.startTime, endTime),

					gt(shiftsTable.endTime, startTime),
				),
			});

			if (shiftConflict) {
				throw new Error('Já existe um plantão neste período.');
			}

			/*
			 * ------------------------------------------------
			 * CONFLITO COM OUTRO COMPROMISSO PESSOAL
			 * ------------------------------------------------
			 */
			const personalConflict = await tx.query.calendarEventsTable.findFirst({
				columns: {
					id: true,
				},
				where: and(
					eq(calendarEventsTable.doctorId, doctorId),

					lt(calendarEventsTable.startTime, endTime),

					gt(calendarEventsTable.endTime, startTime),

					id ? ne(calendarEventsTable.id, id) : undefined,
				),
			});

			if (personalConflict) {
				throw new Error('Já existe um compromisso neste período.');
			}

			const eventData = {
				doctorId,
				title,
				startTime,
				endTime,
				notes: notes?.trim() || null,
			};

			if (existingEvent) {
				const [updatedEvent] = await tx
					.update(calendarEventsTable)
					.set({
						...eventData,
						updatedAt: new Date(),
					})
					.where(eq(calendarEventsTable.id, existingEvent.id))
					.returning();

				if (!updatedEvent) {
					throw new Error('Erro ao atualizar compromisso.');
				}

				return updatedEvent;
			}

			const [createdEvent] = await tx
				.insert(calendarEventsTable)
				.values({
					...eventData,
					type: 'personal',
				})
				.returning();

			if (!createdEvent) {
				throw new Error('Erro ao criar compromisso.');
			}

			return createdEvent;
		});

		/*
		 * A alteração muda tanto a agenda quanto
		 * a disponibilidade para novos appointments.
		 */
		revalidatePath('/agenda');
		revalidatePath('/appointments');

		return result;
	});

export const getCalendarEventDetails = actionClient
	.schema(
		z.object({
			id: z.string().uuid(),
		}),
	)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();

		requireStaff(context);

		const event = await db.query.calendarEventsTable.findFirst({
			where: eq(calendarEventsTable.id, parsedInput.id),
		});

		if (!event) {
			throw new Error('Compromisso não encontrado.');
		}

		if (context.role === 'doctor' && event.doctorId !== context.doctorId) {
			throw new Error(
				'Você não possui permissão para visualizar este compromisso.',
			);
		}

		return event;
	});

export const deleteCalendarEvent = actionClient
	.schema(
		z.object({
			id: z.string().uuid(),
		}),
	)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();

		requireStaff(context);

		const event = await db.query.calendarEventsTable.findFirst({
			where: eq(calendarEventsTable.id, parsedInput.id),
		});

		if (!event) {
			throw new Error('Compromisso não encontrado.');
		}

		if (context.role === 'doctor' && event.doctorId !== context.doctorId) {
			throw new Error(
				'Você não possui permissão para excluir este compromisso.',
			);
		}

		/*
		 * Usamos o mesmo lock da agenda.
		 *
		 * Não é estritamente necessário para a exclusão,
		 * mas mantém a alteração da disponibilidade
		 * serializada com appointments/shifts/events.
		 */
		await db.transaction(async (tx) => {
			await tx.execute(sql`
				SELECT pg_advisory_xact_lock(
					hashtext('lovelyvet:doctor_schedule'),
					hashtext(${event.doctorId})
				)
			`);

			await tx
				.delete(calendarEventsTable)
				.where(eq(calendarEventsTable.id, event.id));
		});

		revalidatePath('/agenda');
		revalidatePath('/appointments');

		return {
			success: true,
		};
	});

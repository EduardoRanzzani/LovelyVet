'use server';

import { db } from '@/db';
import {
	appointmentsTable,
	calendarEventsTable,
	doctorsTable,
	shiftsTable,
} from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { addMinutes } from 'date-fns';
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
import {
	createCalendarEventSchema,
	getCalendarEventAvailabilitySchema,
} from '../schema/calendar-event.schema';

export const getCalendarEventAvailability = actionClient
	.schema(getCalendarEventAvailabilitySchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireStaff(context);

		const { doctorId, dayStart, dayEnd, durationMinutes, eventId } =
			parsedInput;

		if (context.role === 'doctor' && context.doctorId !== doctorId) {
			throw new Error('Você não possui permissão para consultar esta agenda.');
		}

		const queryEnd = addMinutes(dayEnd, durationMinutes);

		const [appointments, shifts, personalEvents] = await Promise.all([
			db.query.appointmentsTable.findMany({
				columns: {
					scheduledAt: true,
					endsAt: true,
				},
				with: {
					items: {
						columns: {},
						with: {
							service: {
								columns: {
									durationMinutes: true,
								},
							},
						},
					},
				},
				where: and(
					eq(appointmentsTable.doctorId, doctorId),
					lt(appointmentsTable.scheduledAt, queryEnd),
					or(
						gt(appointmentsTable.endsAt, dayStart),
						and(
							isNull(appointmentsTable.endsAt),
							gte(appointmentsTable.scheduledAt, dayStart),
						),
					),
					notInArray(appointmentsTable.status, ['cancelled', 'no_show']),
				),
			}),
			db.query.shiftsTable.findMany({
				columns: {
					startTime: true,
					endTime: true,
				},
				where: and(
					eq(shiftsTable.doctorId, doctorId),
					lt(shiftsTable.startTime, queryEnd),
					gt(shiftsTable.endTime, dayStart),
				),
			}),
			db.query.calendarEventsTable.findMany({
				columns: {
					startTime: true,
					endTime: true,
				},
				where: and(
					eq(calendarEventsTable.doctorId, doctorId),
					lt(calendarEventsTable.startTime, queryEnd),
					gt(calendarEventsTable.endTime, dayStart),
					eventId ? ne(calendarEventsTable.id, eventId) : undefined,
				),
			}),
		]);

		const busyIntervals = [
			...appointments.map((appointment) => {
				const fallbackDuration =
					appointment.items.reduce(
						(total, item) => total + item.service.durationMinutes,
						0,
					) || 30;

				return {
					start: appointment.scheduledAt,
					end:
						appointment.endsAt ??
						addMinutes(appointment.scheduledAt, fallbackDuration),
				};
			}),
			...shifts.map((shift) => ({
				start: shift.startTime,
				end: shift.endTime,
			})),
			...personalEvents.map((event) => ({
				start: event.startTime,
				end: event.endTime,
			})),
		];

		const availableStarts: string[] = [];

		for (
			let cursor = new Date(dayStart);
			cursor <= dayEnd;
			cursor = addMinutes(cursor, 5)
		) {
			const candidateEnd = addMinutes(cursor, durationMinutes);

			const hasConflict = busyIntervals.some(
				(interval) => interval.start < candidateEnd && interval.end > cursor,
			);

			if (!hasConflict) {
				availableStarts.push(cursor.toISOString());
			}
		}

		return {
			doctorId,
			dayStart: dayStart.toISOString(),
			durationMinutes,
			availableStarts,
		};
	});

export const upsertCalendarEvent = actionClient
	.schema(createCalendarEventSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireStaff(context);

		const { id, doctorId, title, startTime, endTime, notes } = parsedInput;

		if (context.role === 'doctor' && doctorId !== context.doctorId) {
			throw new Error(
				'Você não possui permissão para alterar a agenda deste veterinário.',
			);
		}

		const result = await db.transaction(async (tx) => {
			const doctor = await tx.query.doctorsTable.findFirst({
				columns: { id: true },
				where: eq(doctorsTable.id, doctorId),
			});

			if (!doctor) {
				throw new Error('Veterinário não encontrado.');
			}

			const existingEvent = id
				? await tx.query.calendarEventsTable.findFirst({
						where: eq(calendarEventsTable.id, id),
					})
				: null;

			if (id && !existingEvent) {
				throw new Error('Compromisso não encontrado.');
			}

			if (
				existingEvent &&
				context.role === 'doctor' &&
				existingEvent.doctorId !== context.doctorId
			) {
				throw new Error(
					'Você não possui permissão para alterar este compromisso.',
				);
			}

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

			const shiftConflict = await tx.query.shiftsTable.findFirst({
				columns: { id: true },
				where: and(
					eq(shiftsTable.doctorId, doctorId),
					lt(shiftsTable.startTime, endTime),
					gt(shiftsTable.endTime, startTime),
				),
			});

			if (shiftConflict) {
				throw new Error(
					'O horário selecionado não está disponível para este veterinário.',
				);
			}

			const appointmentConflict = await tx.query.appointmentsTable.findFirst({
				columns: { id: true },
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
				throw new Error(
					'O horário selecionado não está disponível para este veterinário.',
				);
			}

			const personalConflict = await tx.query.calendarEventsTable.findFirst({
				columns: { id: true },
				where: and(
					eq(calendarEventsTable.doctorId, doctorId),
					lt(calendarEventsTable.startTime, endTime),
					gt(calendarEventsTable.endTime, startTime),
					id ? ne(calendarEventsTable.id, id) : undefined,
				),
			});

			if (personalConflict) {
				throw new Error(
					'O horário selecionado não está disponível para este veterinário.',
				);
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

		await db.transaction(async (tx) => {
			await tx.execute(sql`
				SELECT pg_advisory_xact_lock(
					hashtext('lovelyvet:doctor_schedule'),
					hashtext(${event.doctorId})
				)
			`);

			const [deletedEvent] = await tx
				.delete(calendarEventsTable)
				.where(eq(calendarEventsTable.id, event.id))
				.returning({ id: calendarEventsTable.id });

			if (!deletedEvent) {
				throw new Error('Compromisso não encontrado.');
			}
		});

		revalidatePath('/agenda');
		revalidatePath('/appointments');

		return { success: true };
	});

'use server';

import { db } from '@/db';
import {
	appointmentItemsTable,
	appointmentsTable,
	calendarEventsTable,
	doctorsTable,
	petsTable,
	shiftsTable,
} from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { resolveRequestedDoctorId } from '@/lib/security/doctor-scope';
import {
	buildAppointmentAccessCondition,
	requireAccessibleAppointment,
} from '@/lib/security/appointment-access';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { assertCanAccessPet } from '@/lib/security/pet-access';
import { assertIntervalWithinDoctorWorkingHours } from '@/lib/scheduling/doctor-working-hours';
import {
	addMinutes,
	addMonths,
	endOfMonth,
	startOfMonth,
	subMonths,
} from 'date-fns';
import {
	and,
	count,
	desc,
	eq,
	exists,
	gt,
	gte,
	ilike,
	isNull,
	lt,
	lte,
	ne,
	notInArray,
	or,
	sql,
} from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import z from 'zod';
import { MAX_PAGE_SIZE, monthNames, PaginatedData } from '../config/consts';
import {
	AppointmentListItem,
	AppointmentsWithRelations,
	createAppointmentSchema,
	getDoctorAvailabilitySchema,
} from '../schema/appointments.schema';
import { buildAvailableStarts } from '@/lib/scheduling/availability';

export const getAppointmentsPaginated = async (
	page: number = 1,
	limit: number = MAX_PAGE_SIZE,
	search?: string,
): Promise<PaginatedData<AppointmentListItem>> => {
	const context = await requireAuthContext();
	const offset = (page - 1) * limit;

	const searchCondition = search?.trim()
		? exists(
				db
					.select()
					.from(petsTable)
					.where(
						and(
							eq(petsTable.id, appointmentsTable.petId),
							ilike(petsTable.name, `%${search.trim()}%`),
						),
					),
			)
		: undefined;

	const data = await db.query.appointmentsTable.findMany({
		where: (appointments) =>
			and(
				buildAppointmentAccessCondition(context, undefined, appointments),
				searchCondition,
			),
		limit,
		offset,
		orderBy: desc(appointmentsTable.scheduledAt),
		with: {
			pet: {
				columns: { id: true, name: true },
				with: {
					petTutors: {
						columns: {},
						with: {
							tutor: {
								columns: { id: true },
								with: { user: { columns: { name: true } } },
							},
						},
					},
				},
			},
			doctor: {
				columns: { id: true },
				with: { user: { columns: { name: true } } },
			},
			items: { with: { service: true } },
		},
	});

	const totalCountResult = await db
		.select({
			value: count(),
		})
		.from(appointmentsTable)
		.innerJoin(petsTable, eq(appointmentsTable.petId, petsTable.id))
		.where(
			and(
				buildAppointmentAccessCondition(context),
				search?.trim()
					? ilike(petsTable.name, `%${search.trim()}%`)
					: undefined,
			),
		);

	const totalCount = Number(totalCountResult[0]?.value ?? 0);

	const pageCount = Math.ceil(totalCount / limit);

	const safeData: AppointmentListItem[] = data.map((appointment) => ({
		...appointment,
		doctor: {
			id: appointment.doctor.id,
			user: { name: appointment.doctor.user.name },
		},
		pet: {
			id: appointment.pet.id,
			name: appointment.pet.name,
			petTutors: appointment.pet.petTutors
				.filter(
					({ tutor }) =>
						context.role !== 'customer' || tutor.id === context.customerId,
				)
				.map(({ tutor }) => ({
					tutor: { user: { name: tutor.user.name } },
				})),
		},
	}));

	return {
		data: safeData,
		metadata: {
			totalCount,
			pageCount,
			currentPage: page,
			limit,
		},
	};
};

export const getAllAppointments = async (): Promise<
	AppointmentsWithRelations[]
> => {
	const context = await requireAuthContext();

	requireStaff(context);

	const appointments = await db.query.appointmentsTable.findMany({
		where: (appointments) =>
			buildAppointmentAccessCondition(context, undefined, appointments),
		with: {
			pet: {
				with: {
					petTutors: { with: { tutor: { with: { user: true } } } },
				},
			},
			doctor: { with: { user: true } },
			items: { with: { service: true } },
		},
	});

	return appointments as AppointmentsWithRelations[];
};

export const getAppointments = async (
	monthName?: string,
	extraMonths?: boolean,
): Promise<AppointmentsWithRelations[]> => {
	const context = await requireAuthContext();
	requireStaff(context);

	const now = new Date();
	const year = now.getFullYear();
	const monthIndex = monthName
		? monthNames.indexOf(monthName.toLowerCase())
		: now.getMonth();

	const safeMonthIndex = monthIndex === -1 ? now.getMonth() : monthIndex;
	const referenceDate = new Date(year, safeMonthIndex, 1);

	let startRange = startOfMonth(referenceDate);
	let endRange = endOfMonth(referenceDate);

	if (extraMonths) {
		startRange = startOfMonth(subMonths(referenceDate, 1));
		endRange = endOfMonth(addMonths(referenceDate, 1));
	}

	const appointments = await db.query.appointmentsTable.findMany({
		where: (appointments) =>
			and(
				buildAppointmentAccessCondition(context, undefined, appointments),
				lte(appointments.scheduledAt, endRange),
				gte(appointments.scheduledAt, startRange),
			),
		with: {
			pet: {
				with: {
					petTutors: { with: { tutor: { with: { user: true } } } },
				},
			},
			doctor: { with: { user: true } },
			items: { with: { service: true } },
		},
	});

	return appointments as AppointmentsWithRelations[];
};

export const getDoctorAvailability = actionClient
	.schema(getDoctorAvailabilitySchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();

		const {
			doctorId: requestedDoctorId,
			serviceIds,
			dayStart,
			dayEnd,
			appointmentId,
		} = parsedInput;

		const doctorId = resolveRequestedDoctorId(context, requestedDoctorId);

		const doctor = await db.query.doctorsTable.findFirst({
			columns: {
				id: true,
				availableFromWeekDay: true,
				availableToWeekDay: true,
				availableFromTime: true,
				availableToTime: true,
			},
			where: eq(doctorsTable.id, doctorId),
		});

		if (!doctor) {
			throw new Error('Veterinário não encontrado.');
		}

		/*
		 * Não confiamos na duração enviada pelo navegador.
		 * Ela é sempre derivada dos serviços no banco.
		 */
		const servicesData = await db.query.servicesTable.findMany({
			columns: {
				id: true,
				durationMinutes: true,
			},
			where: (table, { inArray }) => inArray(table.id, serviceIds),
		});

		if (servicesData.length !== new Set(serviceIds).size) {
			throw new Error('Um ou mais serviços selecionados são inválidos.');
		}

		const durationMinutes = servicesData.reduce(
			(total, service) => total + service.durationMinutes,
			0,
		);

		if (durationMinutes <= 0) {
			throw new Error('A duração dos serviços selecionados é inválida.');
		}

		/*
		 * Somente buscamos intervalos ocupados.
		 *
		 * Nenhuma informação privada é devolvida ao cliente:
		 * nem título de calendar_event,
		 * nem clínica,
		 * nem pet de outro atendimento.
		 */
		const [appointments, shifts, personalEvents] = await Promise.all([
			db.query.appointmentsTable.findMany({
				where: and(
					eq(appointmentsTable.doctorId, doctorId),
					lt(appointmentsTable.scheduledAt, dayEnd),
					or(
						gt(appointmentsTable.endsAt, dayStart),
						isNull(appointmentsTable.endsAt),
					),
					notInArray(appointmentsTable.status, ['cancelled', 'no_show']),
					appointmentId ? ne(appointmentsTable.id, appointmentId) : undefined,
				),

				columns: {
					id: true,
					scheduledAt: true,
					endsAt: true,
				},

				with: {
					items: {
						columns: {},
						with: { service: { columns: { durationMinutes: true } } },
					},
				},
			}),

			db.query.shiftsTable.findMany({
				where: and(
					eq(shiftsTable.doctorId, doctorId),
					lt(shiftsTable.startTime, dayEnd),
					gt(shiftsTable.endTime, dayStart),
				),

				columns: {
					startTime: true,
					endTime: true,
				},
			}),

			db.query.calendarEventsTable.findMany({
				where: and(
					eq(calendarEventsTable.doctorId, doctorId),
					lt(calendarEventsTable.startTime, dayEnd),
					gt(calendarEventsTable.endTime, dayStart),
				),

				columns: { startTime: true, endTime: true },
			}),
		]);

		const busyIntervals = [
			...appointments.map((appointment) => {
				/*
				 * endsAt já é preenchido pelos appointments
				 * novos.
				 *
				 * Este fallback mantém a consulta robusta
				 * caso algum registro legado apareça.
				 */
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
		].filter((interval) => interval.start < dayEnd && interval.end > dayStart);

		/*
		 * Mantemos os mesmos 5 minutos já usados
		 * pelo DateTimePicker atual.
		 */
		const availableStarts = buildAvailableStarts({
			dayStart,
			dayEnd,
			durationMinutes,
			doctor,
			busyIntervals,
		});

		return {
			doctorId,
			serviceIds: [...serviceIds].sort(),
			dayStart: dayStart.toISOString(),
			dayEnd: dayEnd.toISOString(),
			durationMinutes,
			availableStarts,
		};
	});

export const upsertAppointment = actionClient
	.schema(createAppointmentSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();

		const { id, services, ...data } = parsedInput;

		const doctorId = resolveRequestedDoctorId(context, data.doctorId);

		/*
		 * BOLA:
		 * customer só pode criar/alterar
		 * appointment utilizando um pet
		 * ao qual possui acesso.
		 */
		await assertCanAccessPet(context, data.petId);

		/*
		 * Em updates validamos também o
		 * appointment original.
		 */
		if (id) {
			const existingAppointment = await requireAccessibleAppointment(
				context,
				id,
			);

			/*
			 * Customer não altera appointments
			 * que já avançaram no fluxo.
			 */
			if (
				context.role === 'customer' &&
				existingAppointment.status !== 'pending'
			) {
				throw new Error('Apenas agendamentos pendentes podem ser alterados');
			}
		}

		try {
			await db.transaction(async (tx) => {
				/*
				 * Não confiamos em preço nem duração
				 * enviados pelo browser.
				 *
				 * Os valores oficiais vêm dos serviços
				 * armazenados no banco.
				 */
				const servicesData = await tx.query.servicesTable.findMany({
					where: (table, { inArray }) => inArray(table.id, services),
				});

				/*
				 * Também impede IDs de serviços
				 * inexistentes.
				 *
				 * new Set evita que duplicatas
				 * no input burlem a comparação.
				 */
				if (servicesData.length !== new Set(services).size) {
					throw new Error('Um ou mais serviços selecionados são inválidos');
				}

				const servicesTotalInCents = servicesData.reduce(
					(total, service) => total + service.priceInCents,
					0,
				);

				/*
				 * O formulário trabalha com reais, embora o campo ainda se chame
				 * totalPriceInCents por compatibilidade com o código existente.
				 *
				 * Customer nunca controla o preço pelo payload.
				 * Staff pode aplicar desconto, acréscimo ou valor negociado.
				 */
				const totalPriceInCents =
					context.role === 'customer'
						? servicesTotalInCents
						: Math.round(data.totalPriceInCents * 100);

				if (!Number.isSafeInteger(totalPriceInCents) || totalPriceInCents < 0) {
					throw new Error('O valor total do agendamento é inválido.');
				}

				/*
				 * O término do atendimento é calculado
				 * exclusivamente no backend.
				 *
				 * Dessa forma o cliente não consegue
				 * manipular a duração pelo payload.
				 */
				const totalDurationMinutes = servicesData.reduce(
					(total, service) => total + service.durationMinutes,
					0,
				);

				if (totalDurationMinutes <= 0) {
					throw new Error('A duração total do atendimento é inválida');
				}

				const endsAt = addMinutes(data.scheduledAt, totalDurationMinutes);

				const doctor = await tx.query.doctorsTable.findFirst({
					columns: {
						id: true,
						availableFromWeekDay: true,
						availableToWeekDay: true,
						availableFromTime: true,
						availableToTime: true,
					},
					where: eq(doctorsTable.id, doctorId),
				});

				if (!doctor) {
					throw new Error('Veterinário não encontrado.');
				}

				assertIntervalWithinDoctorWorkingHours(
					{
						start: data.scheduledAt,
						end: endsAt,
					},
					doctor,
				);

				/*
				 * Serializa alterações da agenda
				 * deste veterinário.
				 *
				 * Sem isso duas requisições concorrentes
				 * poderiam consultar a disponibilidade
				 * simultaneamente e ambas inserir
				 * appointments no mesmo intervalo.
				 *
				 * O lock dura somente até o término
				 * desta transaction.
				 */
				await tx.execute(sql`
					SELECT pg_advisory_xact_lock(
						hashtext('lovelyvet:doctor_schedule'),
						hashtext(${doctorId})
					)
				`);

				/*
				 * Customer nunca controla
				 * diretamente o status.
				 */
				const status = context.role === 'customer' ? 'pending' : data.status;

				/*
				 * Evitamos espalhar diretamente
				 * todo parsedInput na tabela.
				 *
				 * Isso reduz mass assignment.
				 */
				const appointmentData = {
					petId: data.petId,
					doctorId,
					scheduledAt: data.scheduledAt,
					endsAt,
					status,
					notes: data.notes,
					totalPriceInCents,
				};

				/*
				 * Um intervalo conflita quando:
				 *
				 * existingStart < requestedEnd
				 * &&
				 * existingEnd > requestedStart
				 *
				 * Portanto:
				 *
				 * 08:00 - 08:30
				 * 08:30 - 09:00
				 *
				 * é permitido.
				 *
				 * Enquanto:
				 *
				 * 08:00 - 08:30
				 * 08:20 - 09:00
				 *
				 * é conflito.
				 */
				const appointmentConflict = await tx.query.appointmentsTable.findFirst({
					columns: {
						id: true,
					},
					where: and(
						eq(appointmentsTable.doctorId, doctorId),
						lt(appointmentsTable.scheduledAt, endsAt),
						gt(appointmentsTable.endsAt, data.scheduledAt),
						notInArray(appointmentsTable.status, ['cancelled', 'no_show']),
						id ? ne(appointmentsTable.id, id) : undefined,
					),
				});

				if (appointmentConflict) {
					throw new Error(
						'O horário selecionado não está disponível para este veterinário.',
					);
				}

				/*
				 * Um plantão ocupa o intervalo inteiro.
				 *
				 * Não revelamos detalhes do plantão
				 * para quem está tentando realizar
				 * um agendamento.
				 */
				const shiftConflict = await tx.query.shiftsTable.findFirst({
					columns: {
						id: true,
					},
					where: and(
						eq(shiftsTable.doctorId, doctorId),
						lt(shiftsTable.startTime, endsAt),
						gt(shiftsTable.endTime, data.scheduledAt),
					),
				});

				if (shiftConflict) {
					throw new Error(
						'O horário selecionado não está disponível para este veterinário.',
					);
				}

				/*
				 * Compromissos pessoais também
				 * bloqueiam o intervalo.
				 *
				 * Retornamos somente indisponibilidade,
				 * nunca título ou descrição do evento.
				 */
				const calendarEventConflict =
					await tx.query.calendarEventsTable.findFirst({
						columns: {
							id: true,
						},
						where: and(
							eq(calendarEventsTable.doctorId, doctorId),
							lt(calendarEventsTable.startTime, endsAt),
							gt(calendarEventsTable.endTime, data.scheduledAt),
						),
					});

				if (calendarEventConflict) {
					throw new Error(
						'O horário selecionado não está disponível para este veterinário.',
					);
				}

				let appointmentId: string | null = null;

				if (id) {
					await tx
						.update(appointmentsTable)
						.set({
							...appointmentData,
							updatedAt: new Date(),
						})
						.where(eq(appointmentsTable.id, id));

					appointmentId = id;

					await tx
						.delete(appointmentItemsTable)
						.where(eq(appointmentItemsTable.appointmentId, id));
				} else {
					const [newAppointment] = await tx
						.insert(appointmentsTable)
						.values(appointmentData)
						.returning({
							id: appointmentsTable.id,
						});

					if (!newAppointment) {
						throw new Error('Erro ao criar agendamento');
					}

					appointmentId = newAppointment.id;
				}

				/*
				 * services é nonempty no schema,
				 * mas mantemos a guarda também
				 * para deixar a operação explícita.
				 */
				if (appointmentId && servicesData.length > 0) {
					const itemsToInsert = servicesData.map((service) => ({
						appointmentId,
						serviceId: service.id,
						priceAtTimeInCents: service.priceInCents,
					}));

					await tx.insert(appointmentItemsTable).values(itemsToInsert);
				}
			});

			revalidatePath('/appointments');

			return {
				success: true,
			};
		} catch (error: unknown) {
			console.error('Erro no upsert:', error);

			if (error instanceof Error) {
				throw error;
			}

			throw new Error('Ocorreu um erro inesperado ao salvar o agendamento.');
		}
	});

export const deleteAppointment = actionClient
	.schema(
		z.object({
			id: z.uuid(),
		}),
	)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();

		requireStaff(context);

		const appointment = await requireAccessibleAppointment(
			context,
			parsedInput.id,
		);

		if (!appointment) {
			throw new Error('Agendamento não encontrado');
		}

		await db
			.delete(appointmentsTable)
			.where(eq(appointmentsTable.id, parsedInput.id));

		revalidatePath('/appointments');
	});

export const markAsConfirmed = actionClient
	.schema(
		z.object({
			id: z.uuid(),
		}),
	)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();

		requireStaff(context);

		const appointment = await requireAccessibleAppointment(
			context,
			parsedInput.id,
		);

		if (appointment.status !== 'pending') {
			throw new Error('Apenas agendamentos pendentes podem ser confirmados');
		}

		await db
			.update(appointmentsTable)
			.set({
				status: 'confirmed',
				updatedAt: new Date(),
			})
			.where(eq(appointmentsTable.id, parsedInput.id));

		revalidatePath('/appointments');
	});

export const markAppointmentAsCompleted = actionClient
	.schema(
		z.object({
			id: z.uuid(),
		}),
	)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();

		requireStaff(context);

		const appointment = await requireAccessibleAppointment(
			context,
			parsedInput.id,
		);

		if (
			appointment.status !== 'confirmed' &&
			appointment.status !== 'in_progress'
		) {
			throw new Error(
				'O agendamento precisa estar confirmado ou em atendimento para ser concluído',
			);
		}

		await db
			.update(appointmentsTable)
			.set({
				status: 'completed',
				updatedAt: new Date(),
			})
			.where(eq(appointmentsTable.id, parsedInput.id));

		revalidatePath('/appointments');
	});

export const markAppointmentAsCancelled = actionClient
	.schema(
		z.object({
			id: z.uuid(),
		}),
	)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();

		const appointment = await requireAccessibleAppointment(
			context,
			parsedInput.id,
		);

		if (appointment.status !== 'pending') {
			throw new Error('Apenas agendamentos pendentes podem ser cancelados');
		}

		await db
			.update(appointmentsTable)
			.set({
				status: 'cancelled',
				updatedAt: new Date(),
			})
			.where(eq(appointmentsTable.id, parsedInput.id));

		revalidatePath('/appointments');
	});

'use server';

import { db } from '@/db';
import {
	appointmentItemsTable,
	appointmentsTable,
	petsTable,
} from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import {
	buildAppointmentAccessCondition,
	requireAccessibleAppointment,
} from '@/lib/security/appointment-access';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { assertCanAccessPet } from '@/lib/security/pet-access';
import { addMonths, endOfMonth, startOfMonth, subMonths } from 'date-fns';
import { and, count, desc, eq, exists, gte, ilike, lte, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import z from 'zod';
import { MAX_PAGE_SIZE, monthNames, PaginatedData } from '../config/consts';
import {
	AppointmentListItem,
	AppointmentsWithRelations,
	createAppointmentSchema,
} from '../schema/appointments.schema';

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
		where: and(buildAppointmentAccessCondition(context), searchCondition),
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

	/*
	 * Mesmo depois de restringir quais appointments
	 * o customer pode consultar, um pet pode possuir
	 * múltiplos tutores.
	 *
	 * Não devemos enviar os dados pessoais dos outros
	 * tutores ao navegador.
	 */
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
		with: {
			pet: {
				with: {
					petTutors: {
						with: { tutor: { with: { user: true } } },
					},
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
		where: and(
			lte(appointmentsTable.scheduledAt, endRange),
			gte(appointmentsTable.scheduledAt, startRange),
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

export const upsertAppointment = actionClient
	.schema(createAppointmentSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();

		const { id, services, ...data } = parsedInput;

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
				 * Não confiamos no preço
				 * enviado pelo browser.
				 *
				 * O valor oficial vem dos
				 * serviços armazenados no banco.
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

				const totalPriceInCents = servicesData.reduce(
					(total, service) => total + service.priceInCents,
					0,
				);

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
					doctorId: data.doctorId,
					scheduledAt: data.scheduledAt,
					status,
					notes: data.notes,
					totalPriceInCents,
				};

				/*
				 * Validação de conflito
				 * de horário.
				 */
				const conflict = await tx.query.appointmentsTable.findFirst({
					where: and(
						eq(appointmentsTable.doctorId, data.doctorId),
						eq(appointmentsTable.scheduledAt, data.scheduledAt),
						id ? ne(appointmentsTable.id, id) : undefined,
					),
				});

				if (conflict) {
					throw new Error(
						'O veterinário já possui um agendamento neste horário.',
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

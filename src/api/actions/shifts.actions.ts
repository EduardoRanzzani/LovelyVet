'use server';

import { db } from '@/db';
import {
	appointmentsTable,
	calendarEventsTable,
	clinicsTable,
	shiftsTable,
} from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import {
	addHours,
	addMonths,
	endOfMonth,
	startOfMonth,
	subMonths,
} from 'date-fns';
import { and, eq, gt, gte, lt, lte, ne, notInArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { monthNames } from '../config/consts';
import {
	createShiftSchema,
	ShiftsWithRelations,
} from '../schema/shifts.schema';

export const getAllShifts = async (): Promise<ShiftsWithRelations[]> => {
	const context = await requireAuthContext();

	requireStaff(context);

	const result = await db.query.shiftsTable.findMany({
		with: {
			doctor: {
				with: {
					user: true,
				},
			},
		},
	});

	return result as ShiftsWithRelations[];
};

export const getShifts = async (
	monthName?: string,
	extraMonths?: boolean,
): Promise<ShiftsWithRelations[]> => {
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

	const shifts = await db.query.shiftsTable.findMany({
		where: and(
			lte(shiftsTable.startTime, endRange),
			gte(shiftsTable.endTime, startRange),
		),
		with: {
			doctor: {
				with: {
					user: true,
				},
			},
		},
	});

	return shifts as ShiftsWithRelations[];
};

export const upsertShift = actionClient
	.schema(createShiftSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();

		requireStaff(context);

		const {
			id,
			doctorId,
			clinicId,
			startTime,
			duration,
			requesterName,
			amountInCents,
			isPaid,
		} = parsedInput;

		/*
		 * A duração chega do formulário como string.
		 *
		 * Não confiamos apenas no min(1) do input HTML,
		 * pois o payload pode ser enviado diretamente.
		 */
		const durationHours = Number(duration);

		if (!Number.isFinite(durationHours) || durationHours <= 0) {
			throw new Error('A duração do plantão é inválida.');
		}

		const endDate = addHours(startTime, durationHours);

		const shiftResult = await db.transaction(async (tx) => {
			/*
			 * Em updates, garantimos que o plantão
			 * realmente existe.
			 */
			const existingShift = id
				? await tx.query.shiftsTable.findFirst({
						where: eq(shiftsTable.id, id),
					})
				: null;

			if (id && !existingShift) {
				throw new Error('Plantão não encontrado.');
			}

			/*
			 * clinicId é o único dado sobre clínica
			 * aceito do navegador.
			 *
			 * clinicName e valor padrão são resolvidos
			 * diretamente no banco.
			 */
			const clinic = await tx.query.clinicsTable.findFirst({
				where: eq(clinicsTable.id, clinicId),
			});

			if (!clinic) {
				throw new Error('Clínica não encontrada.');
			}

			/*
			 * Uma clínica inativa não pode ser usada
			 * para um novo plantão.
			 *
			 * Permitimos manter uma clínica inativa
			 * apenas ao editar um plantão que já
			 * estava vinculado a ela.
			 */
			if (
				!clinic.isActive &&
				(!existingShift || existingShift.clinicId !== clinic.id)
			) {
				throw new Error('A clínica selecionada está inativa.');
			}

			/*
			 * O formulário trabalha com reais.
			 *
			 * Exemplo:
			 *
			 * 800.50
			 *
			 * vira:
			 *
			 * 80050
			 *
			 * no banco.
			 *
			 * Se o valor não vier informado,
			 * utilizamos o valor padrão cadastrado
			 * na clínica, que já está em centavos.
			 */
			const amount =
				amountInCents !== undefined
					? Math.round(amountInCents * 100)
					: clinic.defaultShiftPriceInCents;

			/*
			 * Serializamos operações da agenda
			 * por veterinário.
			 *
			 * O mesmo lock também é usado na criação
			 * de appointments.
			 *
			 * Isso impede duas requisições simultâneas
			 * de ocuparem o mesmo intervalo.
			 */
			await tx.execute(sql`
					SELECT pg_advisory_xact_lock(
						hashtext(
							'lovelyvet:doctor_schedule'
						),
						hashtext(${doctorId})
					)
				`);

			/*
			 * ------------------------------------------------
			 * CONFLITO COM OUTRO PLANTÃO
			 * ------------------------------------------------
			 *
			 * existingStart < requestedEnd
			 * &&
			 * existingEnd > requestedStart
			 */
			const shiftConflict = await tx.query.shiftsTable.findFirst({
				columns: {
					id: true,
				},
				where: and(
					eq(shiftsTable.doctorId, doctorId),
					lt(shiftsTable.startTime, endDate),
					gt(shiftsTable.endTime, startTime),
					id ? ne(shiftsTable.id, id) : undefined,
				),
			});

			if (shiftConflict) {
				throw new Error('Já existe um plantão neste período.');
			}

			/*
			 * ------------------------------------------------
			 * CONFLITO COM ATENDIMENTOS
			 * ------------------------------------------------
			 *
			 * Appointments cancelados e no-show
			 * não bloqueiam a agenda.
			 */
			const appointmentConflict = await tx.query.appointmentsTable.findFirst({
				columns: {
					id: true,
				},
				where: and(
					eq(appointmentsTable.doctorId, doctorId),
					lt(appointmentsTable.scheduledAt, endDate),
					gt(appointmentsTable.endsAt, startTime),
					notInArray(appointmentsTable.status, ['cancelled', 'no_show']),
				),
			});

			if (appointmentConflict) {
				throw new Error('Existe um atendimento agendado neste período.');
			}

			/*
			 * ------------------------------------------------
			 * CONFLITO COM COMPROMISSOS PESSOAIS
			 * ------------------------------------------------
			 */
			const calendarEventConflict =
				await tx.query.calendarEventsTable.findFirst({
					columns: {
						id: true,
					},
					where: and(
						eq(calendarEventsTable.doctorId, doctorId),
						lt(calendarEventsTable.startTime, endDate),
						gt(calendarEventsTable.endTime, startTime),
					),
				});

			if (calendarEventConflict) {
				throw new Error('Existe um compromisso neste período.');
			}

			/*
			 * clinicName permanece na tabela de plantões
			 * como snapshot histórico.
			 *
			 * Se a clínica mudar de nome no futuro,
			 * o plantão antigo preserva o nome usado
			 * quando foi registrado.
			 */
			const shiftData = {
				doctorId,
				clinicId: clinic.id,
				clinicName: clinic.name,
				startTime,
				endTime: endDate,
				requesterName,
				amountInCents: amount,
				isPaid,
			};

			/*
			 * Preferimos INSERT / UPDATE explícitos
			 * em vez de receber um ID do navegador
			 * e usar onConflictDoUpdate.
			 *
			 * Isso deixa o comportamento mais claro
			 * e evita que um ID inexistente seja
			 * silenciosamente tratado como criação.
			 */
			if (id) {
				const [updatedShift] = await tx
					.update(shiftsTable)
					.set({
						...shiftData,
						updatedAt: new Date(),
					})
					.where(eq(shiftsTable.id, id))
					.returning();

				if (!updatedShift) {
					throw new Error('Erro ao atualizar plantão.');
				}

				return updatedShift;
			}

			const [insertedShift] = await tx
				.insert(shiftsTable)
				.values(shiftData)
				.returning();

			if (!insertedShift) {
				throw new Error('Erro ao salvar plantão.');
			}

			return insertedShift;
		});

		/*
		 * A disponibilidade de appointments depende
		 * dos plantões, portanto invalidamos as duas
		 * rotas.
		 */
		revalidatePath('/shifts');
		revalidatePath('/appointments');

		return shiftResult;
	});

'use server';

import { db } from '@/db';
import { doctorsTable, shiftsTable } from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { currentUser } from '@clerk/nextjs/server';
import {
	addHours,
	addMonths,
	endOfMonth,
	startOfMonth,
	subMonths,
} from 'date-fns';
import { and, eq, gte, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { monthNames } from '../config/consts';
import {
	createShiftSchema,
	ShiftsWithRelations,
} from '../schema/shifts.schema';
import { sendWhatsappMessageInternal } from '@/lib/integrations/whatsapp';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';

export const getAllShifts = async (): Promise<ShiftsWithRelations[]> => {
	const result = await db.query.shiftsTable.findMany({
		with: { doctor: { with: { user: true } } },
	});

	return result as ShiftsWithRelations[];
};

export const getShifts = async (
	monthName?: string,
	extraMonths?: boolean,
): Promise<ShiftsWithRelations[]> => {
	const authenticatedUser = await currentUser();
	if (!authenticatedUser) throw new Error('Usuário não autenticado');

	const now = new Date();
	const year = now.getFullYear();
	const monthIndex = monthName
		? monthNames.indexOf(monthName.toLowerCase())
		: now.getMonth();

	// Fallback para o mês atual se o nome do mês na URL for inválido
	const safeMonthIndex = monthIndex === -1 ? now.getMonth() : monthIndex;

	// Monta a data: Primeiro dia do mês e ano escolhidos
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
		with: { doctor: { with: { user: true } } },
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
			clinicName,
			startTime,
			duration,
			requesterName,
			amountInCents,
			isPaid,
		} = parsedInput;
		const endDate = addHours(startTime, Number(duration));
		const amount = amountInCents ? amountInCents * 100 : null;

		const isNewRegistration = !parsedInput.id;

		const shiftResult = await db.transaction(async (tx) => {
			const [insertedShift] = await tx
				.insert(shiftsTable)
				.values({
					id: id ?? undefined,
					doctorId: doctorId,
					clinicName: clinicName,
					startTime: startTime,
					endTime: endDate,
					requesterName,
					amountInCents: amount,
					isPaid,
				})
				.onConflictDoUpdate({
					target: shiftsTable.id, // O conflito ocorre no ID
					set: {
						doctorId: doctorId,
						clinicName: clinicName,
						startTime: startTime,
						endTime: endDate,
						requesterName,
						amountInCents: amount,
						isPaid,
					},
				})
				.returning();

			if (!insertedShift) throw new Error('Erro ao salvar plantão');
		});

		if (isNewRegistration) {
			const doctor = await db.query.doctorsTable.findFirst({
				where: eq(doctorsTable.id, doctorId),
				with: {
					user: true,
				},
			});

			if (doctor?.phone) {
				// Formatador para: "23/04/2026 às 18:30"
				const formattedDate = new Intl.DateTimeFormat('pt-BR', {
					dateStyle: 'short',
					timeStyle: 'short',
				})
					.format(startTime)
					.replace(',', ' às');

				let doctorName = doctor.gender === 'male' ? 'Dr. ' : 'Dra. ';
				doctorName += doctor.user.name.substring(
					0,
					doctor.user.name.indexOf(' '),
				);

				await sendWhatsappMessageInternal({
					number: '55' + doctor.phone.replace(/\D/g, ''),
					text: `Olá ${doctorName}, seu plantão em ${clinicName} foi agendado para ${formattedDate}.`,
					delay: 1200,
					linkPreview: false,
				});
			}
		}

		revalidatePath('/shifts');
		return shiftResult;
	});

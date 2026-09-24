'use server';

import { db } from '@/db';
import {
	appointmentsTable,
	calendarEventsTable,
	careRemindersTable,
	shiftsTable,
} from '@/db/schema';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import {
	addMonths,
	endOfMonth,
	format,
	startOfMonth,
	subMonths,
} from 'date-fns';
import { and, eq, gte, isNull, lte, or } from 'drizzle-orm';
import { monthNames } from '../config/consts';
import type { CalendarEntry } from '../schema/calendar.schema';
import { getDoctorScopeId } from '@/lib/security/doctor-scope';

export const getCalendarEntries = async (
	monthName?: string,
	extraMonths?: boolean,
	doctorId?: string,
	year?: number,
): Promise<CalendarEntry[]> => {
	const context = await requireAuthContext();

	requireStaff(context);

	/*
	 * Doctor só pode enxergar sua própria agenda.
	 *
	 * Admin pode:
	 * - consultar todos;
	 * - ou filtrar por doctorId.
	 */
	const authenticatedDoctorId = getDoctorScopeId(context);

	const scopedDoctorId = authenticatedDoctorId ?? doctorId;

	const now = new Date();
	const referenceYear =
		year && Number.isInteger(year) ? year : now.getFullYear();

	const monthIndex = monthName
		? monthNames.indexOf(monthName.toLowerCase())
		: now.getMonth();

	const safeMonthIndex = monthIndex === -1 ? now.getMonth() : monthIndex;

	const referenceDate = new Date(referenceYear, safeMonthIndex, 1);

	let startRange = startOfMonth(referenceDate);
	let endRange = endOfMonth(referenceDate);

	if (extraMonths) {
		startRange = startOfMonth(subMonths(referenceDate, 1));

		endRange = endOfMonth(addMonths(referenceDate, 1));
	}

	const startDate = format(startRange, 'yyyy-MM-dd');

	const endDate = format(endRange, 'yyyy-MM-dd');

	const [appointments, shifts, personalEvents, careReminders] =
		await Promise.all([
			db.query.appointmentsTable.findMany({
				where: and(
					scopedDoctorId
						? eq(appointmentsTable.doctorId, scopedDoctorId)
						: undefined,

					/*
					 * Appointment dentro ou atravessando
					 * o intervalo exibido.
					 *
					 * endsAt continua nullable por compatibilidade
					 * de schema, então preservamos fallback para
					 * eventual registro legado.
					 */
					lte(appointmentsTable.scheduledAt, endRange),

					or(
						gte(appointmentsTable.endsAt, startRange),

						and(
							isNull(appointmentsTable.endsAt),
							gte(appointmentsTable.scheduledAt, startRange),
						),
					),
				),

				with: {
					pet: {
						columns: {
							id: true,
							name: true,
						},
					},

					items: {
						columns: {},
						with: {
							service: {
								columns: {
									name: true,
								},
							},
						},
					},
				},
			}),

			db.query.shiftsTable.findMany({
				where: and(
					scopedDoctorId ? eq(shiftsTable.doctorId, scopedDoctorId) : undefined,

					lte(shiftsTable.startTime, endRange),

					gte(shiftsTable.endTime, startRange),
				),
			}),

			db.query.calendarEventsTable.findMany({
				where: and(
					scopedDoctorId
						? eq(calendarEventsTable.doctorId, scopedDoctorId)
						: undefined,

					lte(calendarEventsTable.startTime, endRange),

					gte(calendarEventsTable.endTime, startRange),
				),

				/*
				 * Não buscamos notes na listagem da agenda.
				 */
				columns: {
					id: true,
					doctorId: true,
					title: true,
					startTime: true,
					endTime: true,
				},
			}),

			db.query.careRemindersTable.findMany({
				where: and(
					scopedDoctorId
						? eq(careRemindersTable.doctorId, scopedDoctorId)
						: undefined,

					eq(careRemindersTable.status, 'pending'),

					gte(careRemindersTable.dueDate, startDate),

					lte(careRemindersTable.dueDate, endDate),
				),

				with: {
					pet: {
						columns: {
							id: true,
							name: true,
						},
					},
				},
			}),
		]);

	const appointmentEntries: CalendarEntry[] = appointments.map(
		(appointment) => ({
			kind: 'appointment',
			id: appointment.id,
			doctorId: appointment.doctorId,
			title: `Atendimento - ${appointment.pet.name}`,
			startAt: appointment.scheduledAt,
			endAt: appointment.endsAt,
			blocksSchedule: !['cancelled', 'no_show'].includes(appointment.status),
			status: appointment.status,
			pet: {
				id: appointment.pet.id,
				name: appointment.pet.name,
			},
			services: appointment.items.map((item) => item.service.name),
		}),
	);

	const shiftEntries: CalendarEntry[] = shifts.map((shift) => ({
		kind: 'shift',
		id: shift.id,
		doctorId: shift.doctorId,
		title: shift.clinicName,
		startAt: shift.startTime,
		endAt: shift.endTime,
		blocksSchedule: true,
		clinicId: shift.clinicId,
	}));

	const personalEntries: CalendarEntry[] = personalEvents.map((event) => ({
		kind: 'personal',
		id: event.id,
		doctorId: event.doctorId,
		title: event.title,
		startAt: event.startTime,
		endAt: event.endTime,
		blocksSchedule: true,
	}));

	const reminderEntries: CalendarEntry[] = careReminders.map((reminder) => ({
		kind: 'care_reminder',
		id: reminder.id,
		doctorId: reminder.doctorId,
		title: reminder.title,
		dueDate: reminder.dueDate,
		blocksSchedule: false,
		status: reminder.status,
		pet: {
			id: reminder.pet.id,
			name: reminder.pet.name,
		},
	}));

	return [
		...appointmentEntries,
		...shiftEntries,
		...personalEntries,
		...reminderEntries,
	];
};

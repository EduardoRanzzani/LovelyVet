import 'server-only';

import { db } from '@/db';
import { careRemindersTable, petsTable } from '@/db/schema';
import { normalizePagination } from '@/lib/pagination';
import { resolveShiftMonth } from '@/lib/shifts/shift-month';
import { requireAuthContext } from '@/lib/security/auth-context';
import { buildCareReminderAccessCondition } from '@/lib/security/care-reminder-access';
import { and, asc, count, eq, exists, gte, ilike, isNull, lt } from 'drizzle-orm';
import type { PaginatedData } from '../config/consts';
import type { ClinicalReminderListItem } from '../schema/clinical-reminders.schema';

/** Lista de pendências clínicas. Não gera atendimento nem cobrança. */
export const getClinicalRemindersPaginated = async (
	page = 1,
	limit = 10,
	search?: string,
	month?: string,
): Promise<PaginatedData<ClinicalReminderListItem>> => {
	const context = await requireAuthContext();
	const pagination = normalizePagination(page, limit);
	const selectedMonth = resolveShiftMonth(month);
	const monthStart = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}-01`;
	const nextMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
	const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;
	const keyword = search?.trim();
	const condition = and(
		buildCareReminderAccessCondition(context),
		eq(careRemindersTable.status, 'pending'),
		isNull(careRemindersTable.appointmentId),
		gte(careRemindersTable.dueDate, monthStart),
		lt(careRemindersTable.dueDate, monthEnd),
		keyword
			? exists(
					db
						.select({ id: petsTable.id })
						.from(petsTable)
						.where(and(eq(petsTable.id, careRemindersTable.petId), ilike(petsTable.name, `%${keyword}%`))),
				)
			: undefined,
	);

	const [reminders, totals] = await Promise.all([
		db.query.careRemindersTable.findMany({
			where: (reminder) =>
				and(
					buildCareReminderAccessCondition(context, reminder),
					eq(reminder.status, 'pending'),
					isNull(reminder.appointmentId),
					gte(reminder.dueDate, monthStart),
					lt(reminder.dueDate, monthEnd),
					keyword
						? exists(
								db
									.select({ id: petsTable.id })
									.from(petsTable)
									.where(
										and(eq(petsTable.id, reminder.petId), ilike(petsTable.name, `%${keyword}%`)),
									),
							)
						: undefined,
				),
			orderBy: [asc(careRemindersTable.dueDate), asc(careRemindersTable.id)],
			limit: pagination.limit,
			offset: pagination.offset,
			columns: { id: true, title: true, type: true, dueDate: true },
			with: {
				pet: { columns: { id: true, name: true } },
				sourceVaccine: { columns: { id: true, serviceId: true } },
				doctor: {
					columns: { id: true },
					with: { user: { columns: { name: true } } },
				},
			},
		}),
		db.select({ value: count() }).from(careRemindersTable).where(condition),
	]);

	const totalCount = Number(totals[0]?.value ?? 0);
	return {
		data: reminders.map((reminder) => ({
			kind: 'care_reminder',
			id: reminder.id,
			title: reminder.title,
			type: reminder.type,
			dueDate: reminder.dueDate,
			status: 'pending',
			sourceServiceId: reminder.sourceVaccine?.serviceId ?? null,
			pet: reminder.pet,
			doctor: { id: reminder.doctor.id, name: reminder.doctor.user.name },
		})),
		metadata: {
			totalCount,
			pageCount: Math.ceil(totalCount / pagination.limit),
			currentPage: pagination.page,
			limit: pagination.limit,
		},
	};
};

import 'server-only';

import { db } from '@/db';
import { careRemindersTable, petsTable } from '@/db/schema';
import { normalizePagination } from '@/lib/pagination';
import { requireAuthContext } from '@/lib/security/auth-context';
import { buildCareReminderAccessCondition } from '@/lib/security/care-reminder-access';
import { and, asc, count, eq, exists, ilike } from 'drizzle-orm';
import type { PaginatedData } from '../config/consts';
import type { ClinicalReminderListItem } from '../schema/clinical-reminders.schema';

/** Lista de pendências clínicas. Não gera atendimento nem cobrança. */
export const getClinicalRemindersPaginated = async (
	page = 1,
	limit = 10,
	search?: string,
): Promise<PaginatedData<ClinicalReminderListItem>> => {
	const context = await requireAuthContext();
	const pagination = normalizePagination(page, limit);
	const keyword = search?.trim();
	const condition = and(
		buildCareReminderAccessCondition(context),
		eq(careRemindersTable.status, 'pending'),
		keyword
			? exists(
					db
						.select({ id: petsTable.id })
						.from(petsTable)
						.where(
							and(
								eq(petsTable.id, careRemindersTable.petId),
								ilike(petsTable.name, `%${keyword}%`),
							),
						),
				)
			: undefined,
	);

	const [reminders, totals] = await Promise.all([
		db.query.careRemindersTable.findMany({
			where: (reminder) =>
				and(
					buildCareReminderAccessCondition(context, reminder),
					eq(reminder.status, 'pending'),
					keyword
						? exists(
								db
									.select({ id: petsTable.id })
									.from(petsTable)
									.where(
										and(
											eq(petsTable.id, reminder.petId),
											ilike(petsTable.name, `%${keyword}%`),
										),
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

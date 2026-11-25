import 'server-only';

import { getAppointmentsPaginated } from '@/api/actions/appointments.actions';
import { getClinicalRemindersPaginated } from '@/api/actions/clinical-reminders.actions';
import type { PaginatedData } from '@/api/config/consts';
import { MAX_PAGE_SIZE } from '@/api/config/consts';
import { normalizePagination } from '@/lib/pagination';
import { mergeUnifiedAppointments, type UnifiedAppointmentItem } from '@/lib/appointments/unified-appointments';

/**
 * Uma única página cronológica, com buscas e autorização preservadas pelas
 * duas consultas existentes. Busca apenas os prefixos necessários de cada
 * fonte; lotes de 100 evitam o limite por consulta nas páginas posteriores.
 */
export const getUnifiedAppointmentsPaginated = async (
	page = 1,
	limit = MAX_PAGE_SIZE,
	search?: string,
): Promise<PaginatedData<UnifiedAppointmentItem>> => {
	const pagination = normalizePagination(page, limit);
	const desiredCount = pagination.page * pagination.limit;
	const batchSize = 100;

	const [firstAppointments, firstReminders] = await Promise.all([
		getAppointmentsPaginated(1, batchSize, search),
		getClinicalRemindersPaginated(1, batchSize, search),
	]);

	const appointments = [...firstAppointments.data];
	const reminders = [...firstReminders.data];
	const appointmentCount = firstAppointments.metadata.totalCount;
	const reminderCount = firstReminders.metadata.totalCount;

	let nextBatch = 2;
	while (
		(appointments.length < Math.min(desiredCount, appointmentCount) ||
			reminders.length < Math.min(desiredCount, reminderCount)) &&
		(appointments.length < appointmentCount || reminders.length < reminderCount)
	) {
		const [appointmentBatch, reminderBatch] = await Promise.all([
			appointments.length < Math.min(desiredCount, appointmentCount)
				? getAppointmentsPaginated(nextBatch, batchSize, search)
				: null,
			reminders.length < Math.min(desiredCount, reminderCount)
				? getClinicalRemindersPaginated(nextBatch, batchSize, search)
				: null,
		]);
		if (appointmentBatch) appointments.push(...appointmentBatch.data);
		if (reminderBatch) reminders.push(...reminderBatch.data);
		nextBatch += 1;
	}

	const totalCount = appointmentCount + reminderCount;
	const merged = mergeUnifiedAppointments(appointments, reminders);
	return {
		data: merged.slice(pagination.offset, pagination.offset + pagination.limit),
		metadata: {
			currentPage: pagination.page,
			limit: pagination.limit,
			totalCount,
			pageCount: Math.ceil(totalCount / pagination.limit),
		},
	};
};

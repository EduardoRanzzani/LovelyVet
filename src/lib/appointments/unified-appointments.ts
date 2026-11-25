import type { AppointmentListItem } from '@/api/schema/appointments.schema';
import type { ClinicalReminderListItem } from '@/api/schema/clinical-reminders.schema';
import { parseISO } from 'date-fns';

export type UnifiedAppointmentItem = (AppointmentListItem & { kind: 'appointment' }) | ClinicalReminderListItem;

export const getUnifiedAppointmentDate = (item: UnifiedAppointmentItem): Date =>
	item.kind === 'care_reminder' ? parseISO(item.dueDate) : new Date(item.scheduledAt);

export const mergeUnifiedAppointments = (
	appointments: AppointmentListItem[],
	reminders: ClinicalReminderListItem[],
): UnifiedAppointmentItem[] =>
	[...appointments.map((item) => ({ ...item, kind: 'appointment' as const })), ...reminders].sort((a, b) => {
		const dateDiff = getUnifiedAppointmentDate(a).getTime() - getUnifiedAppointmentDate(b).getTime();
		if (dateDiff !== 0) return dateDiff;
		return `${a.kind}-${a.id}`.localeCompare(`${b.kind}-${b.id}`);
	});

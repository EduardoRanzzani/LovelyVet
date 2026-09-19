import type { InferSelectModel } from 'drizzle-orm';
import type { appointmentsTable } from '@/db/schema';

type AppointmentStatus = InferSelectModel<typeof appointmentsTable>['status'];

export type CalendarAppointmentEntry = {
	kind: 'appointment';
	id: string;
	doctorId: string;
	title: string;
	startAt: Date;
	endAt: Date | null;
	blocksSchedule: true;
	status: AppointmentStatus;
	pet: {
		id: string;
		name: string;
	};
	services: string[];
};

export type CalendarShiftEntry = {
	kind: 'shift';
	id: string;
	doctorId: string;
	title: string;
	startAt: Date;
	endAt: Date;
	blocksSchedule: true;
	clinicId: string | null;
};

export type CalendarPersonalEntry = {
	kind: 'personal';
	id: string;
	doctorId: string;
	title: string;
	startAt: Date;
	endAt: Date;
	blocksSchedule: true;
};

export type CalendarCareReminderEntry = {
	kind: 'care_reminder';
	id: string;
	doctorId: string;
	title: string;
	dueDate: string;
	blocksSchedule: false;
	status: 'pending' | 'completed' | 'cancelled';
	pet: {
		id: string;
		name: string;
	};
};

export type CalendarEntry =
	| CalendarAppointmentEntry
	| CalendarShiftEntry
	| CalendarPersonalEntry
	| CalendarCareReminderEntry;

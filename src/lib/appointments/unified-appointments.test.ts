import { describe, expect, it } from 'vitest';
import { mergeUnifiedAppointments } from './unified-appointments';
import type { AppointmentListItem } from '@/api/schema/appointments.schema';
import type { ClinicalReminderListItem } from '@/api/schema/clinical-reminders.schema';

const appointment = {
	id: 'appointment-1',
	scheduledAt: new Date(2026, 10, 20, 14),
} as AppointmentListItem;
const reminder: ClinicalReminderListItem = {
	kind: 'care_reminder',
	id: 'reminder-1',
	dueDate: '2026-11-22',
	title: 'Vacina: V10',
	type: 'vaccine',
	status: 'pending',
	sourceServiceId: null,
	pet: { id: 'pet-1', name: 'Margot' },
	doctor: { id: 'doctor-1', name: 'Regina' },
};

describe('mergeUnifiedAppointments', () => {
	it('exibe ambos os tipos na mesma lista', () => {
		const entries = mergeUnifiedAppointments([appointment], [reminder]);
		expect(entries.map(({ kind }) => kind)).toEqual(['appointment', 'care_reminder']);
	});

	it('preserva o lembrete como retorno sem gerar cobrança', () => {
		const [entry] = mergeUnifiedAppointments([], [reminder]);
		expect(entry.kind).toBe('care_reminder');
		if (entry.kind === 'care_reminder') {
			expect(entry.pet.name).toBe('Margot');
			expect(entry).not.toHaveProperty('totalPriceInCents');
		}
	});

	it('não altera os objetos originais', () => {
		mergeUnifiedAppointments([appointment], [reminder]);
		expect(appointment).not.toHaveProperty('kind');
	});
});

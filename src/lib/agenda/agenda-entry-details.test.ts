import { describe, expect, it } from 'vitest';
import { getAgendaEntryDetails } from './agenda-entry-details';
import type { CalendarAppointmentEntry, CalendarShiftEntry } from '@/api/schema/calendar.schema';

const appointment: CalendarAppointmentEntry = {
	kind: 'appointment',
	id: 'a1',
	doctorId: 'd1',
	title: 'Atendimento - Margot',
	startAt: new Date(2026, 10, 22, 14),
	endAt: new Date(2026, 10, 22, 15),
	blocksSchedule: true,
	status: 'pending',
	pet: { id: 'p1', name: 'Margot' },
	services: ['Vacina V10'],
};
const shift: CalendarShiftEntry = {
	kind: 'shift',
	id: 's1',
	doctorId: 'd1',
	title: 'Plantão',
	startAt: new Date(2026, 10, 27, 19, 30),
	endAt: new Date(2026, 10, 28, 7, 30),
	blocksSchedule: true,
	clinicId: null,
};

describe('getAgendaEntryDetails', () => {
	it('direciona atendimentos à listagem existente', () => {
		expect(getAgendaEntryDetails(appointment).listHref).toBe('/appointments');
	});
	it('mantém identificação do estado de atendimento', () => {
		expect(getAgendaEntryDetails(appointment).statusLabel).toBe('Pendente');
	});
	it('direciona plantões à tela existente', () => {
		expect(getAgendaEntryDetails(shift).listHref).toBe('/shifts');
	});
	it('identifica plantões noturnos pelo início', () => {
		expect(getAgendaEntryDetails(shift).shiftLabel).toBe('Noturno');
	});
	it('identifica plantões diurnos', () => {
		expect(getAgendaEntryDetails({ ...shift, startAt: new Date(2026, 10, 27, 7) }).shiftLabel).toBe('Diurno');
	});
});

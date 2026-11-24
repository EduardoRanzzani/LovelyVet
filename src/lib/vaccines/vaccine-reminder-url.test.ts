import { describe, expect, it } from 'vitest';
import { getVaccineReminderUrl } from './vaccine-reminder-url';

describe('getVaccineReminderUrl', () => {
	it('deve navegar para o pet com o lembrete', () => {
		const url = getVaccineReminderUrl('pet-123', 'reminder-456', 'V10');

		expect(url).toBe(
			'/pets/pet-123?vaccineReminder=reminder-456&vaccineName=V10',
		);
	});

	it('deve preservar nomes com espaços e acentos', () => {
		const url = getVaccineReminderUrl(
			'pet-123',
			'reminder-456',
			'Vacina antirrábica',
		);

		const parsed = new URL(url, 'http://localhost');

		expect(parsed.searchParams.get('vaccineName')).toBe('Vacina antirrábica');
	});

	it('deve preservar o identificador do lembrete', () => {
		const url = getVaccineReminderUrl('pet-123', 'reminder-456', 'V10');

		const parsed = new URL(url, 'http://localhost');

		expect(parsed.searchParams.get('vaccineReminder')).toBe('reminder-456');
	});
});


describe('fluxo do reforco convertido em atendimento', () => {
	it('inclui o atendimento ao abrir registro da nova dose', () => {
		const url = getVaccineReminderUrl('pet-id','reminder-id','V10','appointment-id','service-id','doctor-id');
		const parsed = new URL(url,'http://localhost');
		expect(parsed.searchParams.get('appointmentId')).toBe('appointment-id');
		expect(parsed.searchParams.get('vaccineReminder')).toBe('reminder-id');
		expect(parsed.searchParams.get('vaccineService')).toBe('service-id');
		expect(parsed.searchParams.get('vaccineDoctor')).toBe('doctor-id');
	});
});

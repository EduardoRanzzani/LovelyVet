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

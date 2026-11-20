import { describe, expect, it } from 'vitest';
import { formatVaccineNextDose } from './format-next-dose';

describe('formatVaccineNextDose', () => {
	it('deve formatar corretamente a próxima dose', () => {
		const date = new Date(2026, 10, 20, 12);

		expect(formatVaccineNextDose(date)).toBe('20/11/2026');
	});

	it('deve tratar a ausência de próxima dose', () => {
		expect(formatVaccineNextDose(null)).toBe('Sem próxima dose prevista');
	});

	it('deve tratar uma data indefinida', () => {
		expect(formatVaccineNextDose(undefined)).toBe('Sem próxima dose prevista');
	});

	it('deve tratar uma data inválida', () => {
		expect(formatVaccineNextDose('data-invalida')).toBe('Data não informada');
	});
});

import { describe, expect, it } from 'vitest';
import { formatShiftMonth, resolveShiftMonth } from './shift-month';

const fallback = new Date(2026, 10, 23);

describe('navegação de mês e ano dos plantões', () => {
	it('interpreta meses de outros anos', () => {
		const parsed = resolveShiftMonth('2027-01', fallback);
		expect(parsed.getFullYear()).toBe(2027);
		expect(parsed.getMonth()).toBe(0);
	});

	it('preserva links legados que usam somente o mês', () => {
		const parsed = resolveShiftMonth('december', fallback);
		expect(formatShiftMonth(parsed)).toBe('2026-12');
	});

	it('ignora mês inválido, sem normalizar para outro ano', () => {
		expect(formatShiftMonth(resolveShiftMonth('2026-13', fallback))).toBe('2026-11');
		expect(formatShiftMonth(resolveShiftMonth('invalid', fallback))).toBe('2026-11');
	});

	it('suporta navegação dezembro para janeiro e retorno', () => {
		const december = resolveShiftMonth('2026-12', fallback);
		const january = new Date(december.getFullYear(), december.getMonth() + 1, 1);
		const previous = new Date(january.getFullYear(), january.getMonth() - 1, 1);
		expect(formatShiftMonth(january)).toBe('2027-01');
		expect(formatShiftMonth(previous)).toBe('2026-12');
	});
});

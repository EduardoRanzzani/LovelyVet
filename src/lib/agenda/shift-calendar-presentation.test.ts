import { describe, expect, it } from 'vitest';
import {
	getShiftCalendarClass,
	isNightShift,
	startsOnCalendarDay,
} from './shift-calendar-presentation';

describe('shift-calendar-presentation', () => {
	it('identifica plantão diurno', () => {
		expect(isNightShift(new Date(2026, 10, 20, 7, 30))).toBe(false);
	});

	it('identifica plantão noturno', () => {
		expect(isNightShift(new Date(2026, 10, 27, 19))).toBe(true);
	});

	it('considera 18h como início do período noturno', () => {
		expect(isNightShift(new Date(2026, 10, 20, 18))).toBe(true);
	});

	it('apresenta o plantão somente no dia de entrada', () => {
		const start = new Date(2026, 10, 27, 19);

		expect(startsOnCalendarDay(start, new Date(2026, 10, 27))).toBe(true);

		expect(startsOnCalendarDay(start, new Date(2026, 10, 28))).toBe(false);
	});

	it('utiliza azul-marinho no plantão noturno', () => {
		expect(getShiftCalendarClass(new Date(2026, 10, 27, 19))).toContain(
			'bg-blue-950',
		);
	});

	it('utiliza amarelo no plantão diurno', () => {
		expect(getShiftCalendarClass(new Date(2026, 10, 28, 7))).toContain(
			'bg-amber-100',
		);
	});
});

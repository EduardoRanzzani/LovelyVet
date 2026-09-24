import { describe, expect, it } from 'vitest';

import { buildAvailableStarts } from './availability';

const doctor = {
	availableFromWeekDay: 1,
	availableToWeekDay: 5,
	availableFromTime: '08:00:00',
	availableToTime: '18:00:00',
};

const date = (value: string) => new Date(value);

describe('buildAvailableStarts', () => {
	it('returns only intervals inside doctor working hours', () => {
		const result = buildAvailableStarts({
			dayStart: date('2026-09-21T00:00:00-04:00'),
			dayEnd: date('2026-09-22T00:00:00-04:00'),
			durationMinutes: 30,
			doctor,
			busyIntervals: [],
		});

		expect(result).toContain(date('2026-09-21T08:00:00-04:00').toISOString());

		expect(result).toContain(date('2026-09-21T17:30:00-04:00').toISOString());

		expect(result).not.toContain(
			date('2026-09-21T07:55:00-04:00').toISOString(),
		);

		expect(result).not.toContain(
			date('2026-09-21T17:35:00-04:00').toISOString(),
		);
	});

	it('removes starts that would overlap a busy interval', () => {
		const result = buildAvailableStarts({
			dayStart: date('2026-09-21T00:00:00-04:00'),
			dayEnd: date('2026-09-22T00:00:00-04:00'),
			durationMinutes: 30,
			doctor,
			busyIntervals: [
				{
					start: date('2026-09-21T10:00:00-04:00'),
					end: date('2026-09-21T11:00:00-04:00'),
				},
			],
		});

		/*
		 * Termina exatamente quando o compromisso começa.
		 */
		expect(result).toContain(date('2026-09-21T09:30:00-04:00').toISOString());

		/*
		 * Sobrepõe 10:00.
		 */
		expect(result).not.toContain(
			date('2026-09-21T09:35:00-04:00').toISOString(),
		);

		expect(result).not.toContain(
			date('2026-09-21T10:00:00-04:00').toISOString(),
		);

		/*
		 * Começa exatamente quando o compromisso termina.
		 */
		expect(result).toContain(date('2026-09-21T11:00:00-04:00').toISOString());
	});

	it('returns no availability outside the working week', () => {
		const result = buildAvailableStarts({
			dayStart: date('2026-09-26T00:00:00-04:00'),
			dayEnd: date('2026-09-27T00:00:00-04:00'),
			durationMinutes: 30,
			doctor,
			busyIntervals: [],
		});

		expect(result).toEqual([]);
	});

	it('takes appointment duration into account', () => {
		const result = buildAvailableStarts({
			dayStart: date('2026-09-21T00:00:00-04:00'),
			dayEnd: date('2026-09-22T00:00:00-04:00'),
			durationMinutes: 90,
			doctor,
			busyIntervals: [],
		});

		expect(result).toContain(date('2026-09-21T16:30:00-04:00').toISOString());

		expect(result).not.toContain(
			date('2026-09-21T16:35:00-04:00').toISOString(),
		);
	});

	it('rejects zero or negative duration', () => {
		expect(() =>
			buildAvailableStarts({
				dayStart: date('2026-09-21T00:00:00-04:00'),
				dayEnd: date('2026-09-22T00:00:00-04:00'),
				durationMinutes: 0,
				doctor,
				busyIntervals: [],
			}),
		).toThrow('A duração do atendimento deve ser maior que zero.');
	});

	it('rejects an invalid day interval', () => {
		expect(() =>
			buildAvailableStarts({
				dayStart: date('2026-09-22T00:00:00-04:00'),
				dayEnd: date('2026-09-21T00:00:00-04:00'),
				durationMinutes: 30,
				doctor,
				busyIntervals: [],
			}),
		).toThrow('O intervalo do dia é inválido.');
	});
});

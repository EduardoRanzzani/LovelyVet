import { describe, expect, it } from 'vitest';
import { getCalendarEntryTimeLabel } from './calendar-entry-time';

describe('getCalendarEntryTimeLabel', () => {
	it('exibe entrada e saída no mesmo dia', () => {
		expect(
			getCalendarEntryTimeLabel(
				new Date(2026, 10, 20, 8),
				new Date(2026, 10, 20, 17),
				new Date(2026, 10, 20),
			),
		).toBe('08:00 - 17:00');
	});

	it('exibe entrada no primeiro dia de plantão', () => {
		expect(
			getCalendarEntryTimeLabel(
				new Date(2026, 10, 20, 19),
				new Date(2026, 10, 21, 7),
				new Date(2026, 10, 20),
			),
		).toBe('Entrada: 19:00');
	});

	it('exibe saída no último dia de plantão', () => {
		expect(
			getCalendarEntryTimeLabel(
				new Date(2026, 10, 20, 19),
				new Date(2026, 10, 21, 7),
				new Date(2026, 10, 21),
			),
		).toBe('Saída: 07:00');
	});

	it('exibe continuação em dias intermediários', () => {
		expect(
			getCalendarEntryTimeLabel(
				new Date(2026, 10, 20, 19),
				new Date(2026, 10, 22, 7),
				new Date(2026, 10, 21),
			),
		).toBe('Continuação');
	});

	it('exibe entrada quando não existe horário final', () => {
		expect(
			getCalendarEntryTimeLabel(
				new Date(2026, 10, 20, 14),
				null,
				new Date(2026, 10, 20),
			),
		).toBe('Entrada: 14:00');
	});
});

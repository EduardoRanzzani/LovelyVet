import { describe, expect, it } from 'vitest';
import {
	getMobileCalendarIndicatorClass,
	getMobileCalendarVisibleCount,
} from './mobile-calendar-indicators';

describe('mobile-calendar-indicators', () => {
	it('deve limitar a quantidade de indicadores visíveis', () => {
		expect(getMobileCalendarVisibleCount(7)).toEqual({
			visible: 3,
			remaining: 4,
		});
	});

	it('não deve apresentar contador quando houver poucos eventos', () => {
		expect(getMobileCalendarVisibleCount(2)).toEqual({
			visible: 2,
			remaining: 0,
		});
	});

	it('deve diferenciar visualmente os estados de lembretes', () => {
		const baseReminder = {
			kind: 'care_reminder' as const,
		};

		const pending = getMobileCalendarIndicatorClass({
			...baseReminder,
			status: 'pending',
		} as Parameters<typeof getMobileCalendarIndicatorClass>[0]);

		const completed = getMobileCalendarIndicatorClass({
			...baseReminder,
			status: 'completed',
		} as Parameters<typeof getMobileCalendarIndicatorClass>[0]);

		const cancelled = getMobileCalendarIndicatorClass({
			...baseReminder,
			status: 'cancelled',
		} as Parameters<typeof getMobileCalendarIndicatorClass>[0]);

		expect(pending).toContain('orange');
		expect(completed).toContain('emerald');
		expect(cancelled).toContain('opacity-60');
	});
});

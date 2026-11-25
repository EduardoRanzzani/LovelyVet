import type { CalendarEntry } from '@/api/schema/calendar.schema';
import { isNightShift } from './shift-calendar-presentation';

export const getMobileCalendarIndicatorClass = (entry: CalendarEntry): string => {
	switch (entry.kind) {
		case 'appointment':
			return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200';

		case 'shift':
			return isNightShift(entry.startAt) ? 'bg-blue-950 text-blue-200' : 'bg-amber-100 text-amber-900';

		case 'personal':
			return 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200';

		case 'care_reminder':
			switch (entry.status) {
				case 'completed':
					return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200';

				case 'cancelled':
					return 'bg-muted text-muted-foreground opacity-60';

				case 'pending':
					return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200';
			}
	}
};

export const getMobileCalendarVisibleCount = (total: number, limit = 3) => ({
	visible: Math.min(total, limit),
	remaining: Math.max(total - limit, 0),
});

import { isSameDay } from 'date-fns';

export const isNightShift = (startAt: Date | string): boolean => {
	const hour = new Date(startAt).getHours();

	return hour >= 18 || hour < 6;
};

export const startsOnCalendarDay = (startAt: Date | string, day: Date): boolean => {
	return isSameDay(new Date(startAt), day);
};

export const getShiftCalendarClass = (startAt: Date | string): string => {
	return isNightShift(startAt)
		? 'border-indigo-600 bg-blue-950 text-blue-200'
		: 'border-amber-400 bg-amber-100 text-amber-900';
};

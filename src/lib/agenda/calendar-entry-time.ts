import { format, isSameDay } from 'date-fns';

export const getCalendarEntryTimeLabel = (startAt: Date, endAt: Date | null, currentDay: Date): string => {
	const start = new Date(startAt);
	const end = endAt ? new Date(endAt) : null;

	const isStart = isSameDay(start, currentDay);
	const isEnd = end ? isSameDay(end, currentDay) : false;

	if (isStart && isEnd && end) {
		return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
	}

	if (isStart) {
		return `Entrada: ${format(start, 'HH:mm')}`;
	}

	if (isEnd && end) {
		return `Saída: ${format(end, 'HH:mm')}`;
	}

	return 'Continuação';
};

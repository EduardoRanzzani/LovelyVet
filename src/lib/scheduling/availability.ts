import { addMinutes } from 'date-fns';

import {
	type DoctorWorkingHours,
	type Interval,
	isIntervalWithinDoctorWorkingHours,
} from './doctor-working-hours';

type BuildAvailableStartsInput = {
	dayStart: Date;
	dayEnd: Date;
	durationMinutes: number;
	doctor: DoctorWorkingHours;
	busyIntervals: Interval[];
	stepMinutes?: number;
};

export const buildAvailableStarts = ({
	dayStart,
	dayEnd,
	durationMinutes,
	doctor,
	busyIntervals,
	stepMinutes = 5,
}: BuildAvailableStartsInput): string[] => {
	if (durationMinutes <= 0) {
		throw new Error('A duração do atendimento deve ser maior que zero.');
	}

	if (stepMinutes <= 0) {
		throw new Error('O intervalo entre horários deve ser maior que zero.');
	}

	if (dayEnd <= dayStart) {
		throw new Error('O intervalo do dia é inválido.');
	}

	const availableStarts: string[] = [];

	for (
		let cursor = new Date(dayStart);
		cursor < dayEnd;
		cursor = addMinutes(cursor, stepMinutes)
	) {
		const candidateEnd = addMinutes(cursor, durationMinutes);

		if (candidateEnd > dayEnd) {
			break;
		}

		if (
			!isIntervalWithinDoctorWorkingHours(
				{
					start: cursor,
					end: candidateEnd,
				},
				doctor,
			)
		) {
			continue;
		}

		const hasConflict = busyIntervals.some(
			(interval) => interval.start < candidateEnd && interval.end > cursor,
		);

		if (!hasConflict) {
			availableStarts.push(cursor.toISOString());
		}
	}

	return availableStarts;
};

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

const APPLICATION_TIME_ZONE = 'America/Campo_Grande';

export type DoctorWorkingHours = {
	availableFromWeekDay: number;
	availableToWeekDay: number;
	availableFromTime: string;
	availableToTime: string;
};

export type Interval = {
	start: Date;
	end: Date;
};

const parseTimeToMinutes = (time: string): number => {
	const [hourString, minuteString] = time.split(':');

	const hour = Number(hourString);
	const minute = Number(minuteString);

	if (
		!Number.isInteger(hour) ||
		!Number.isInteger(minute) ||
		hour < 0 ||
		hour > 23 ||
		minute < 0 ||
		minute > 59
	) {
		throw new Error('Horário de atendimento do veterinário é inválido.');
	}

	return hour * 60 + minute;
};

const isWeekDayInRange = (
	weekDay: number,
	fromWeekDay: number,
	toWeekDay: number,
): boolean => {
	/*
	 * Intervalo normal:
	 *
	 * segunda (1) → sexta (5)
	 */
	if (fromWeekDay <= toWeekDay) {
		return weekDay >= fromWeekDay && weekDay <= toWeekDay;
	}

	/*
	 * Também suportamos intervalo atravessando
	 * o fim da semana:
	 *
	 * sexta (5) → terça (2)
	 */
	return weekDay >= fromWeekDay || weekDay <= toWeekDay;
};

export const isIntervalWithinDoctorWorkingHours = (
	interval: Interval,
	doctor: DoctorWorkingHours,
): boolean => {
	if (interval.end <= interval.start) {
		return false;
	}

	const start = dayjs(interval.start).tz(APPLICATION_TIME_ZONE);
	const end = dayjs(interval.end).tz(APPLICATION_TIME_ZONE);

	/*
	 * Atendimento não pode atravessar a virada do dia.
	 */
	if (start.format('YYYY-MM-DD') !== end.format('YYYY-MM-DD')) {
		return false;
	}

	const weekDay = start.day();

	if (
		!isWeekDayInRange(
			weekDay,
			doctor.availableFromWeekDay,
			doctor.availableToWeekDay,
		)
	) {
		return false;
	}

	const workingFromMinutes = parseTimeToMinutes(doctor.availableFromTime);

	const workingToMinutes = parseTimeToMinutes(doctor.availableToTime);

	if (workingFromMinutes >= workingToMinutes) {
		throw new Error(
			'O horário inicial de atendimento deve ser anterior ao horário final.',
		);
	}

	const startMinutes = start.hour() * 60 + start.minute();
	const endMinutes =
		end.hour() * 60 +
		end.minute() +
		(end.second() > 0 || end.millisecond() > 0 ? 1 : 0);

	return startMinutes >= workingFromMinutes && endMinutes <= workingToMinutes;
};

export const assertIntervalWithinDoctorWorkingHours = (
	interval: Interval,
	doctor: DoctorWorkingHours,
) => {
	if (!isIntervalWithinDoctorWorkingHours(interval, doctor)) {
		throw new Error(
			'O horário selecionado está fora do horário de atendimento deste veterinário.',
		);
	}
};

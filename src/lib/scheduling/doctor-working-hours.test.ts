import { describe, expect, it } from 'vitest';

import {
	assertIntervalWithinDoctorWorkingHours,
	isIntervalWithinDoctorWorkingHours,
} from './doctor-working-hours';

const doctor = {
	availableFromWeekDay: 1,
	availableToWeekDay: 5,
	availableFromTime: '08:00:00',
	availableToTime: '18:00:00',
};

const date = (value: string) => new Date(value);

describe('isIntervalWithinDoctorWorkingHours', () => {
	it('allows an appointment exactly at the start of working hours', () => {
		expect(
			isIntervalWithinDoctorWorkingHours(
				{
					start: date('2026-09-21T08:00:00-04:00'),
					end: date('2026-09-21T08:30:00-04:00'),
				},
				doctor,
			),
		).toBe(true);
	});

	it('allows an appointment ending exactly at the end of working hours', () => {
		expect(
			isIntervalWithinDoctorWorkingHours(
				{
					start: date('2026-09-21T17:30:00-04:00'),
					end: date('2026-09-21T18:00:00-04:00'),
				},
				doctor,
			),
		).toBe(true);
	});

	it('rejects an appointment before working hours', () => {
		expect(
			isIntervalWithinDoctorWorkingHours(
				{
					start: date('2026-09-21T07:30:00-04:00'),
					end: date('2026-09-21T08:00:00-04:00'),
				},
				doctor,
			),
		).toBe(false);
	});

	it('rejects an appointment ending after working hours', () => {
		expect(
			isIntervalWithinDoctorWorkingHours(
				{
					start: date('2026-09-21T17:45:00-04:00'),
					end: date('2026-09-21T18:15:00-04:00'),
				},
				doctor,
			),
		).toBe(false);
	});

	it('rejects a saturday appointment', () => {
		expect(
			isIntervalWithinDoctorWorkingHours(
				{
					start: date('2026-09-26T09:00:00-04:00'),
					end: date('2026-09-26T09:30:00-04:00'),
				},
				doctor,
			),
		).toBe(false);
	});

	it('rejects an appointment crossing midnight', () => {
		expect(
			isIntervalWithinDoctorWorkingHours(
				{
					start: date('2026-09-21T17:30:00-04:00'),
					end: date('2026-09-22T08:30:00-04:00'),
				},
				doctor,
			),
		).toBe(false);
	});

	it('supports a working-week range that crosses sunday', () => {
		const nightDoctor = {
			...doctor,
			availableFromWeekDay: 5,
			availableToWeekDay: 2,
		};

		expect(
			isIntervalWithinDoctorWorkingHours(
				{
					start: date('2026-09-20T09:00:00-04:00'),
					end: date('2026-09-20T09:30:00-04:00'),
				},
				nightDoctor,
			),
		).toBe(true);
	});
});

describe('assertIntervalWithinDoctorWorkingHours', () => {
	it('throws when the interval is outside working hours', () => {
		expect(() =>
			assertIntervalWithinDoctorWorkingHours(
				{
					start: date('2026-09-21T07:00:00-04:00'),
					end: date('2026-09-21T07:30:00-04:00'),
				},
				doctor,
			),
		).toThrow(
			'O horário selecionado está fora do horário de atendimento deste veterinário.',
		);
	});
});

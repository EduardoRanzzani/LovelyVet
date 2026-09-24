import { describe, expect, it } from 'vitest';

import { createDoctorWithUserSchema } from './doctors.schema';

const validDoctor = {
	name: 'Regina Maciel',
	email: 'regina@example.com',
	image: '',
	phone: '67999999999',
	cpf: '00000000000',
	gender: 'female' as const,
	licenseNumber: '1234',
	licenseState: 'MS',
	specialty: 'Clínica Geral',
	availableFromWeekDay: '1' as const,
	availableToWeekDay: '5' as const,
	availableFromTime: '08:00',
	availableToTime: '18:00',
};

describe('createDoctorWithUserSchema', () => {
	it('accepts valid working hours', () => {
		const result = createDoctorWithUserSchema.safeParse(validDoctor);

		expect(result.success).toBe(true);
	});

	it('rejects an invalid start weekday', () => {
		const result = createDoctorWithUserSchema.safeParse({
			...validDoctor,
			availableFromWeekDay: '7',
		});

		expect(result.success).toBe(false);
	});

	it('rejects an invalid end weekday', () => {
		const result = createDoctorWithUserSchema.safeParse({
			...validDoctor,
			availableToWeekDay: '-1',
		});

		expect(result.success).toBe(false);
	});

	it('rejects an invalid start time', () => {
		const result = createDoctorWithUserSchema.safeParse({
			...validDoctor,
			availableFromTime: '25:00',
		});

		expect(result.success).toBe(false);
	});

	it('rejects an invalid end time', () => {
		const result = createDoctorWithUserSchema.safeParse({
			...validDoctor,
			availableToTime: '18:99',
		});

		expect(result.success).toBe(false);
	});

	it('rejects equal start and end times', () => {
		const result = createDoctorWithUserSchema.safeParse({
			...validDoctor,
			availableFromTime: '08:00',
			availableToTime: '08:00',
		});

		expect(result.success).toBe(false);
	});

	it('rejects an end time before the start time', () => {
		const result = createDoctorWithUserSchema.safeParse({
			...validDoctor,
			availableFromTime: '18:00',
			availableToTime: '08:00',
		});

		expect(result.success).toBe(false);
	});

	it('accepts a weekday range that crosses sunday', () => {
		const result = createDoctorWithUserSchema.safeParse({
			...validDoctor,
			availableFromWeekDay: '5',
			availableToWeekDay: '2',
		});

		expect(result.success).toBe(true);
	});
});

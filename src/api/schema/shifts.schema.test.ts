import { describe, expect, it } from 'vitest';

import { createShiftSchema } from './shifts.schema';

const validShift = {
	doctorId: '284fc65a-9e6d-469a-900d-ff0d1005fe5a',
	clinicId: '8dfc76df-67dc-456f-b7ed-aa13b99a0123',
	startTime: new Date('2026-09-25T08:00:00-04:00'),
	duration: '12',
	requesterName: 'Teste',
	amountInCents: 800,
	isPaid: false,
};

describe('createShiftSchema', () => {
	it('accepts a valid monetary value', () => {
		expect(createShiftSchema.safeParse(validShift).success).toBe(true);
	});

	it('accepts zero', () => {
		expect(
			createShiftSchema.safeParse({
				...validShift,
				amountInCents: 0,
			}).success,
		).toBe(true);
	});

	it('rejects a negative amount', () => {
		expect(
			createShiftSchema.safeParse({
				...validShift,
				amountInCents: -1,
			}).success,
		).toBe(false);
	});

	it('rejects infinity', () => {
		expect(
			createShiftSchema.safeParse({
				...validShift,
				amountInCents: Number.POSITIVE_INFINITY,
			}).success,
		).toBe(false);
	});
});

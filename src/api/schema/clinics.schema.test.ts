import { describe, expect, it } from 'vitest';

import { createClinicSchema } from './clinics.schema';

const validClinic = {
	name: 'Clínica Teste',
	phone: '(67) 99999-9999',
	defaultShiftPriceInCents: 800,
	isActive: true,
	postalCode: '79000-000',
	address: 'Rua Teste',
	addressNumber: '123',
	neighborhood: 'Centro',
	city: 'Campo Grande',
	state: 'MS',
};

describe('createClinicSchema', () => {
	it('accepts a valid clinic', () => {
		expect(createClinicSchema.safeParse(validClinic).success).toBe(true);
	});

	it('rejects zero shift price', () => {
		const result = createClinicSchema.safeParse({
			...validClinic,
			defaultShiftPriceInCents: 0,
		});

		expect(result.success).toBe(false);
	});

	it('rejects negative shift price', () => {
		const result = createClinicSchema.safeParse({
			...validClinic,
			defaultShiftPriceInCents: -100,
		});

		expect(result.success).toBe(false);
	});

	it('rejects infinite shift price', () => {
		const result = createClinicSchema.safeParse({
			...validClinic,
			defaultShiftPriceInCents: Number.POSITIVE_INFINITY,
		});

		expect(result.success).toBe(false);
	});
});

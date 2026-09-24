import { describe, expect, it } from 'vitest';

import { createServiceSchema } from './services.schema';

const validService = {
	name: 'Consulta veterinária',
	description: 'Consulta clínica',
	specieId: null,
	price: 150,
};

describe('createServiceSchema', () => {
	it('accepts a valid service', () => {
		const result = createServiceSchema.safeParse(validService);

		expect(result.success).toBe(true);
	});

	it('accepts a fractional monetary value', () => {
		const result = createServiceSchema.safeParse({
			...validService,
			price: 149.9,
		});

		expect(result.success).toBe(true);
	});

	it('rejects zero price', () => {
		const result = createServiceSchema.safeParse({
			...validService,
			price: 0,
		});

		expect(result.success).toBe(false);
	});

	it('rejects negative price', () => {
		const result = createServiceSchema.safeParse({
			...validService,
			price: -10,
		});

		expect(result.success).toBe(false);
	});

	it('rejects infinite price', () => {
		const result = createServiceSchema.safeParse({
			...validService,
			price: Number.POSITIVE_INFINITY,
		});

		expect(result.success).toBe(false);
	});
});

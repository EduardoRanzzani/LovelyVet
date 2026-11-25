import { describe, expect, it } from 'vitest';
import { createVaccineSchema } from './vaccine.schema';

const validVaccine = {
	petId: '550e8400-e29b-41d4-a716-446655440000',
	name: 'V10',
	applicationDate: new Date('2026-11-20T12:00:00'),
	nextDoseType: 'booster' as const,
	daysToNextDose: 21,
	doctorId: '550e8400-e29b-41d4-a716-446655440001',
};

describe('createVaccineSchema', () => {
	it('deve aceitar uma vacina válida', () => {
		const result = createVaccineSchema.safeParse(validVaccine);

		expect(result.success).toBe(true);
	});

	it('deve remover espaços do nome da vacina', () => {
		const result = createVaccineSchema.safeParse({
			...validVaccine,
			name: '  V10  ',
		});

		expect(result.success).toBe(true);

		if (result.success) {
			expect(result.data.name).toBe('V10');
		}
	});

	it('não deve aceitar nome composto apenas por espaços', () => {
		const result = createVaccineSchema.safeParse({
			...validVaccine,
			name: '   ',
		});

		expect(result.success).toBe(false);
	});

	it('deve exigir dias quando o tipo é booster', () => {
		const result = createVaccineSchema.safeParse({
			...validVaccine,
			daysToNextDose: '',
		});

		expect(result.success).toBe(false);

		if (!result.success) {
			expect(result.error.issues.some((issue) => issue.path[0] === 'daysToNextDose')).toBe(true);
		}
	});

	it('deve aceitar reforço anual sem informar dias', () => {
		const result = createVaccineSchema.safeParse({
			...validVaccine,
			nextDoseType: 'annual',
			daysToNextDose: '',
		});

		expect(result.success).toBe(true);
	});

	it('deve aceitar vacina sem próxima dose', () => {
		const result = createVaccineSchema.safeParse({
			...validVaccine,
			nextDoseType: 'none',
			daysToNextDose: undefined,
		});

		expect(result.success).toBe(true);
	});

	it('não deve aceitar dias negativos', () => {
		const result = createVaccineSchema.safeParse({
			...validVaccine,
			daysToNextDose: -10,
		});

		expect(result.success).toBe(false);
	});

	it('não deve aceitar dias fracionados', () => {
		const result = createVaccineSchema.safeParse({
			...validVaccine,
			daysToNextDose: 1.5,
		});

		expect(result.success).toBe(false);
	});
	it('rejeita serviceId que não é UUID', () => {
		const result = createVaccineSchema.safeParse({
			...validVaccine,
			serviceId: 'invalido',
		});
		expect(result.success).toBe(false);
	});
});

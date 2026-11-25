import { describe, expect, it } from 'vitest';
import { buildVaccineSubmitPayload } from './vaccine-submit-payload';
import type { CreateVaccineSchema } from '@/api/schema/vaccine.schema';

const vaccine = {
	petId: '11111111-1111-4111-8111-111111111111',
	name: 'V10',
	applicationDate: new Date(2026, 10, 20),
	nextDoseType: 'none' as const,
	doctorId: '22222222-2222-4222-8222-222222222222',
};

describe('buildVaccineSubmitPayload', () => {
	it('não envia reminderId vazio no cadastro manual', () => {
		const result = buildVaccineSubmitPayload({ ...vaccine, reminderId: '' } as CreateVaccineSchema, null);

		expect(result).not.toHaveProperty('reminderId');
	});

	it('envia o identificador ao concluir pela agenda', () => {
		const reminderId = '33333333-3333-4333-8333-333333333333';

		const result = buildVaccineSubmitPayload(vaccine, reminderId);

		expect(result.reminderId).toBe(reminderId);
	});

	it('preserva a data de aplicação retroativa', () => {
		const applicationDate = new Date(2025, 5, 10);

		const result = buildVaccineSubmitPayload({ ...vaccine, applicationDate }, null);

		expect(result.applicationDate).toEqual(applicationDate);
	});
});

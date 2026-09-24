import { describe, expect, it } from 'vitest';

import { assertVaccineBelongsToPet } from './vaccine-integrity';

describe('assertVaccineBelongsToPet', () => {
	it('allows a vaccine that belongs to the informed pet', () => {
		expect(() =>
			assertVaccineBelongsToPet({ id: 'vaccine-a', petId: 'pet-a' }, 'pet-a'),
		).not.toThrow();
	});

	it('rejects a vaccine that belongs to another pet', () => {
		expect(() =>
			assertVaccineBelongsToPet({ id: 'vaccine-a', petId: 'pet-a' }, 'pet-b'),
		).toThrow('Vacina não encontrada para este pet.');
	});

	it('rejects a vaccine that does not exist', () => {
		expect(() => assertVaccineBelongsToPet(undefined, 'pet-a')).toThrow(
			'Vacina não encontrada para este pet.',
		);
	});

	it('rejects a null vaccine', () => {
		expect(() => assertVaccineBelongsToPet(null, 'pet-a')).toThrow(
			'Vacina não encontrada para este pet.',
		);
	});
});

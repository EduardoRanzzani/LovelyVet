import { describe, expect, it } from 'vitest';
import {
	createItiPrescriptionResponse,
	isValidItiSecretCode,
} from './iti-validation';

describe('ITI prescription validation protocol', () => {
	it('accepts the secret code regardless of surrounding spaces or case', () => {
		expect(isValidItiSecretCode('  ab12cd  ', 'AB12CD')).toBe(true);
	});

	it('rejects an absent or different secret code', () => {
		expect(isValidItiSecretCode(null, 'AB12CD')).toBe(false);
		expect(isValidItiSecretCode('AB12CE', 'AB12CD')).toBe(false);
	});

	it('returns the signed PDF URL in the structure required by the ITI validator', () => {
		expect(
			createItiPrescriptionResponse(
				'https://app.reginamaciel.com.br/receitas/validar/id/pdf',
			),
		).toEqual({
			version: '1.0.0',
			prescription: {
				signatureFiles: [
					{
						url: 'https://app.reginamaciel.com.br/receitas/validar/id/pdf',
					},
				],
			},
		});
	});
});

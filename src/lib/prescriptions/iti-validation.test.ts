import { describe, expect, it } from 'vitest';
import {
	createItiPrescriptionResponse,
	isItiValidatorFormat,
	isValidItiSecretCode,
} from './iti-validation';

describe('ITI prescription validation protocol', () => {
	it.each([
		'application/validador-iti+json',
		'application/validador-iti json',
	])('recognizes the ITI format: %s', (format) => {
		expect(isItiValidatorFormat(format)).toBe(true);
	});

	it.each([null, '', 'application/json', 'application/pdf'])(
		'does not treat other formats as ITI: %s',
		(format) => expect(isItiValidatorFormat(format)).toBe(false),
	);

	it.each(['ABC-123', 'A'.repeat(65), 'ABC_123'])(
		'rejects codes outside the ITI alphanumeric 0–64 character format',
		(code) => expect(isValidItiSecretCode(code, code)).toBe(false),
	);

	it('accepts the documented code length boundaries', () => {
		expect(isValidItiSecretCode('', '')).toBe(true);
		expect(isValidItiSecretCode('A'.repeat(64), 'A'.repeat(64))).toBe(true);
	});

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

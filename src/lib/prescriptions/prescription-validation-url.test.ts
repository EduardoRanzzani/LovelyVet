import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPrescriptionQrCodeUrl } from './prescription-validation-url';

afterEach(() => vi.unstubAllEnvs());

describe('ITI QR Code URL', () => {
	it.each(['https://example.com', 'https://example.com/'])(
		'generates an HTTPS URL without query parameters from %s',
		(appUrl) => {
			vi.stubEnv('APP_URL', appUrl);
			const url = getPrescriptionQrCodeUrl('signature-id');
			expect(url).toBe('https://example.com/receitas/validar/signature-id/pdf');
			expect(new URL(url).search).toBe('');
		},
	);

	it.each([
		'http://example.com',
		'https://example.com?foo=bar',
		'https://example.com#fragment',
		'https://user:password@example.com',
	])('rejects configuration that would generate an invalid QR: %s', (appUrl) => {
		vi.stubEnv('APP_URL', appUrl);
		expect(() => getPrescriptionQrCodeUrl('signature-id')).toThrow('APP_URL');
	});
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { limit } = vi.hoisted(() => ({ limit: vi.fn() }));
vi.mock('@/db', () => ({
	db: {
		select: () => ({
			from: () => ({
				innerJoin: () => ({ where: () => ({ limit }) }),
			}),
		}),
	},
}));

import { GET } from './route';
import { ITI_VALIDATOR_FORMAT } from '@/lib/prescriptions/iti-validation';

const id = '449d2f3c-8131-44d9-82f3-b392d389ae21';
const pdf = new TextEncoder().encode('%PDF-1.7\nsigned-original-bytes');
const baseUrl = `https://example.com/receitas/validar/${id}/pdf`;
const get = (query = '', accept = 'text/html,application/xhtml+xml,*/*;q=0.8') =>
	GET(new Request(`${baseUrl}${query}`, { headers: { accept } }), {
		params: Promise.resolve({ id }),
	});

afterEach(() => vi.unstubAllEnvs());

beforeEach(() => {
	vi.stubEnv('APP_URL', 'https://example.com');
	limit.mockResolvedValue([{
		documentData: { patient: { name: 'Paciente' } },
		pdf,
		pdfSha256: 'original-hash',
		validationToken: 'ABC123',
	}]);
});

describe('public prescription PDF', () => {
	it('opens the viewer for existing QR codes visited in a browser', async () => {
		const response = await get();
		expect(response.status).toBe(307);
		expect(response.headers.get('location')).toBe(`/receitas/validar/${id}/visualizar`);
		expect(response.headers.get('cache-control')).toBe('private, no-store');
	});

	it.each(['application/pdf', '*/*', ''])('preserves direct PDF access for clients accepting %s', async (accept) => {
		const response = await get('', accept);
		expect(response.headers.get('content-type')).toBe('application/pdf');
		expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([...pdf]);
	});

	it('returns unchanged signed bytes for the renderer even with an HTML Accept header', async () => {
		const response = await get('?raw=1');
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('application/pdf');
		expect(response.headers.get('content-disposition')).toMatch(/^inline;/);
		expect(response.headers.get('x-pdf-sha256')).toBe('original-hash');
		expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([...pdf]);
	});

	it.each([ITI_VALIDATOR_FORMAT, encodeURIComponent(ITI_VALIDATOR_FORMAT)])('gives ITI a direct PDF URL for format %s', async (format) => {
		const response = await get(`?_format=${format}&_secretCode=ABC123`);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			version: '1.0.0',
			prescription: { signatureFiles: [{ url: `${baseUrl}?raw=1` }] },
		});
	});

	it('still rejects incorrect ITI access codes', async () => {
		const response = await get(`?_format=${encodeURIComponent(ITI_VALIDATOR_FORMAT)}&_secretCode=wrong`);
		expect(response.status).toBe(401);
	});

	it('returns 404 for an unknown prescription', async () => {
		limit.mockResolvedValue([]);
		expect((await get()).status).toBe(404);
	});
});


describe('ITI QR Code flow', () => {
	it('serves the original signed file from the URL returned by the protocol', async () => {
		const { getPrescriptionQrCodeUrl } = await import('@/lib/prescriptions/prescription-validation-url');
		const qrUrl = getPrescriptionQrCodeUrl(id);
		const protocolUrl = `${qrUrl}?_format=application/validador-iti+json&_secretCode=ABC123`;
		const response = await GET(new Request(protocolUrl), { params: Promise.resolve({ id }) });
		const body = await response.json();
		const pdfResponse = await GET(new Request(body.prescription.signatureFiles[0].url, {
			headers: { accept: 'text/html' },
		}), { params: Promise.resolve({ id }) });
		expect(pdfResponse.status).toBe(200);
		expect(pdfResponse.headers.get('content-type')).toBe('application/pdf');
		expect([...new Uint8Array(await pdfResponse.arrayBuffer())]).toEqual([...pdf]);
	});

	it.each(['', '&_secretCode=wrong', '&_secretCode=ABC-123', `&_secretCode=${'A'.repeat(65)}`])(
		'returns 401 for a missing or invalid access code: %s',
		async (secret) => {
			const response = await get(`?_format=application/validador-iti+json${secret}`);
			expect(response.status).toBe(401);
		},
	);

	it('returns 404 when ITI requests an unknown prescription', async () => {
		limit.mockResolvedValue([]);
		const response = await get('?_format=application/validador-iti+json&_secretCode=ABC123');
		expect(response.status).toBe(404);
	});
});

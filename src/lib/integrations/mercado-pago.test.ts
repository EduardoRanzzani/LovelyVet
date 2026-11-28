import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatMercadoPagoAmount, getMercadoPagoOrderClient, normalizeMercadoPagoOrderStatus } from './mercado-pago';

const sdk = vi.hoisted(() => ({ config: vi.fn(), order: vi.fn() }));
vi.mock('mercadopago', () => ({
	MercadoPagoConfig: class {
		constructor(options: unknown) {
			sdk.config(options);
		}
	},
	Order: class {
		constructor(config: unknown) {
			sdk.order(config);
		}
	},
}));

beforeEach(() => {
	vi.stubEnv('CLERK_ENVIRONMENT', 'development');
	vi.stubEnv('MERCADO_PAGO_TEST_MODE', 'true');
	vi.stubEnv('MERCADO_PAGO_ACCESS_TOKEN', 'token-ficticio-1');
	vi.stubEnv('MERCADO_PAGO_WEBHOOK_SECRET', 'segredo-ficticio');
	vi.stubEnv('MERCADO_PAGO_COLLECTOR_ID', '123456');
});
afterEach(() => vi.unstubAllEnvs());

describe('cliente Orders', () => {
	it('isola o cliente de cada operação e inicializa com timeout', () => {
		vi.stubEnv('MERCADO_PAGO_ACCESS_TOKEN', 'token-cache-exclusivo');
		const first = getMercadoPagoOrderClient();
		expect(getMercadoPagoOrderClient()).not.toBe(first);
		expect(sdk.config).toHaveBeenCalledWith({
			accessToken: 'token-cache-exclusivo',
			options: { timeout: 10_000 },
		});
		expect(sdk.config).toHaveBeenCalledTimes(2);
		expect(sdk.order).toHaveBeenCalledTimes(2);
	});
	it('recria o cliente quando a credencial muda', () => {
		const first = getMercadoPagoOrderClient();
		vi.stubEnv('MERCADO_PAGO_ACCESS_TOKEN', 'token-ficticio-2');
		expect(getMercadoPagoOrderClient()).not.toBe(first);
	});
	it('revalida ambiente a cada criação de cliente', () => {
		getMercadoPagoOrderClient();
		vi.stubEnv('CLERK_ENVIRONMENT', 'production');
		expect(() => getMercadoPagoOrderClient()).toThrow('incompatíveis');
	});
});

describe('valor para Orders', () => {
	it.each([
		{ cents: 1, expected: '0.01' },
		{ cents: 105, expected: '1.05' },
		{ cents: 15000, expected: '150.00' },
		{ cents: 2_147_483_647, expected: '21474836.47' },
	])('formata $cents centavos sem arredondamento', ({ cents, expected }) => {
		expect(formatMercadoPagoAmount(cents)).toBe(expected);
	});
	it.each([0, -1, 1.5, NaN, Infinity, 2_147_483_648])('rejeita %s centavos inválidos', (cents) => {
		expect(() => formatMercadoPagoAmount(cents)).toThrow('Valor inválido');
	});
});

describe('normalização preliminar de Orders', () => {
	it.each([
		{ status: 'created', detail: 'created', expected: 'created' },
		{ status: 'processing', detail: 'in_process', expected: 'processing' },
		{ status: 'processed', detail: 'accredited', expected: 'approved' },
		{ status: 'action_required', detail: 'waiting_payment', expected: 'pending' },
		{ status: 'action_required', detail: 'waiting_capture', expected: 'pending' },
		{ status: 'action_required', detail: 'waiting_transfer', expected: 'pending' },
		{ status: 'action_required', detail: 'waiting_retry', expected: 'pending' },
		{ status: 'action_required', detail: 'pending_challenge', expected: 'pending' },
		{ status: 'canceled', detail: 'expired', expected: 'expired' },
		{ status: 'failed', detail: 'expired', expected: 'expired' },
		{ status: 'canceled', detail: 'canceled', expected: 'cancelled' },
		{ status: 'failed', detail: 'failed', expected: 'rejected' },
		{ status: 'processed', detail: 'partially_refunded', expected: 'review' },
		{ status: 'refunded', detail: 'refunded', expected: 'review' },
		{ status: 'charged_back', detail: 'in_process', expected: 'review' },
		{ status: 'processed', detail: null, expected: 'review' },
		{ status: 'unknown', detail: 'accredited', expected: 'review' },
	])('classifica $status / $detail como $expected', ({ status, detail, expected }) => {
		expect(normalizeMercadoPagoOrderStatus(status, detail)).toBe(expected);
	});
});

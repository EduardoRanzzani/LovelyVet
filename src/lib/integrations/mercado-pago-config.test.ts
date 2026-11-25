import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	assertMercadoPagoEnabled,
	getMercadoPagoConfig,
	getMercadoPagoEnvironment,
	isMercadoPagoEnabled,
} from './mercado-pago-config';

beforeEach(() => {
	vi.stubEnv('MERCADO_PAGO_ENABLED', undefined);
	vi.stubEnv('MERCADO_PAGO_TEST_MODE', 'true');
	vi.stubEnv('CLERK_ENVIRONMENT', 'development');
	vi.stubEnv('MERCADO_PAGO_ACCESS_TOKEN', 'token-ficticio');
	vi.stubEnv('MERCADO_PAGO_WEBHOOK_SECRET', 'segredo-ficticio');
	vi.stubEnv('MERCADO_PAGO_COLLECTOR_ID', '123456');
});
afterEach(() => vi.unstubAllEnvs());

describe('configuração Mercado Pago', () => {
	it('mantém novas cobranças desativadas por padrão', () => {
		expect(isMercadoPagoEnabled()).toBe(false);
		expect(() => assertMercadoPagoEnabled()).toThrow('desabilitados');
	});
	it('permite ativação explícita', () => {
		vi.stubEnv('MERCADO_PAGO_ENABLED', 'true');
		expect(() => assertMercadoPagoEnabled()).not.toThrow();
	});
	it('rejeita flag mal configurada', () => {
		vi.stubEnv('MERCADO_PAGO_ENABLED', '1');
		expect(() => isMercadoPagoEnabled()).toThrow('MERCADO_PAGO_ENABLED');
	});
	it('permite obter configuração de conciliação mesmo com criação desligada', () => {
		expect(getMercadoPagoConfig()).toEqual({
			environment: 'test',
			collectorId: '123456',
			accessToken: 'token-ficticio',
			webhookSecret: 'segredo-ficticio',
		});
	});
	it('aceita produção somente com Clerk Production', () => {
		vi.stubEnv('MERCADO_PAGO_TEST_MODE', 'false');
		vi.stubEnv('CLERK_ENVIRONMENT', 'production');
		expect(getMercadoPagoEnvironment()).toBe('production');
	});
	it.each([
		['true', 'production'],
		['false', 'development'],
	])('rejeita cruzamento %s / %s', (mode, clerk) => {
		vi.stubEnv('MERCADO_PAGO_TEST_MODE', mode);
		vi.stubEnv('CLERK_ENVIRONMENT', clerk);
		expect(() => getMercadoPagoEnvironment()).toThrow('incompatíveis');
	});
	it.each([undefined, 'TRUE', ''])('rejeita modo ausente ou inválido: %s', (mode) => {
		vi.stubEnv('MERCADO_PAGO_TEST_MODE', mode);
		expect(() => getMercadoPagoEnvironment()).toThrow('MERCADO_PAGO_TEST_MODE');
	});
	it.each(['MERCADO_PAGO_ACCESS_TOKEN', 'MERCADO_PAGO_WEBHOOK_SECRET', 'MERCADO_PAGO_COLLECTOR_ID'])(
		'rejeita segredo/configuração ausente: %s',
		(name) => {
			vi.stubEnv(name, '  ');
			expect(() => getMercadoPagoConfig()).toThrow(name);
		},
	);
	it('rejeita recebedor não numérico', () => {
		vi.stubEnv('MERCADO_PAGO_COLLECTOR_ID', '12/34');
		expect(() => getMercadoPagoConfig()).toThrow('COLLECTOR_ID');
	});
});

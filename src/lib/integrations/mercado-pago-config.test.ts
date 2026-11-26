import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	assertMercadoPagoEnabled,
	assertMercadoPagoTestCollector,
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
afterEach(() => {
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
});

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

describe('validação remota do recebedor de teste', () => {
	function reply(account: unknown, ok = true) {
		const request = vi.fn().mockResolvedValue({ ok, json: async () => account });
		vi.stubGlobal('fetch', request);
		return request;
	}
	it('aceita somente conta de teste com Collector ID correspondente', async () => {
		const request = reply({ id: 123456, tags: ['test_user'] });
		await expect(assertMercadoPagoTestCollector(getMercadoPagoConfig())).resolves.toBeUndefined();
		expect(request).toHaveBeenCalledWith(
			'https://api.mercadolibre.com/users/me',
			expect.objectContaining({
				method: 'GET',
				headers: { Authorization: 'Bearer token-ficticio', Accept: 'application/json' },
				cache: 'no-store',
				redirect: 'error',
				signal: expect.anything(),
			}),
		);
	});
	it.each([
		null,
		{ id: 123456 },
		{ id: 123456, tags: [] },
		{ id: 999, tags: ['test_user'] },
		{ id: {}, tags: ['test_user'] },
	])('bloqueia resposta incompatível: %j', async (account) => {
		reply(account);
		await expect(assertMercadoPagoTestCollector(getMercadoPagoConfig())).rejects.toThrow('incompatível');
	});
	it('bloqueia erro HTTP sem expor resposta', async () => {
		reply({ secret: 'segredo-remoto' }, false);
		await expect(assertMercadoPagoTestCollector(getMercadoPagoConfig())).rejects.toThrow(
			'Não foi possível validar',
		);
	});
	it('oculta erro de rede', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('segredo-remoto')));
		await expect(assertMercadoPagoTestCollector(getMercadoPagoConfig())).rejects.toThrow(
			'Não foi possível validar',
		);
	});
	it('nega configuração de produção antes da rede', async () => {
		const request = reply({});
		await expect(
			assertMercadoPagoTestCollector({ ...getMercadoPagoConfig(), environment: 'production' }),
		).rejects.toThrow('homologação obrigatória');
		expect(request).not.toHaveBeenCalled();
	});
});

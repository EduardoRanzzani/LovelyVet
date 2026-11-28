import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	initializeCheckoutSdk,
	initializeCheckoutSecurity,
	readCheckoutDeviceId,
	waitForCheckoutDeviceId,
} from './mercado-pago-checkout-sdk';

const mocks = vi.hoisted(() => ({ init: vi.fn() }));
vi.mock('@mercadopago/sdk-react', () => ({ initMercadoPago: mocks.init }));

afterEach(() => {
	vi.useRealTimers();
	document
		.querySelectorAll('script[src="https://www.mercadopago.com/v2/security.js"]')
		.forEach((script) => script.remove());
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
	mocks.init.mockClear();
});

describe('SDK de checkout compartilhado', () => {
	it('inicializa uma vez para a mesma chave', () => {
		vi.stubEnv('NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY', 'TEST-checkout');
		initializeCheckoutSdk();
		initializeCheckoutSdk();
		expect(mocks.init).toHaveBeenCalledExactlyOnceWith('TEST-checkout', { locale: 'pt-BR' });
	});
	it('não inicializa sem chave', () => {
		vi.stubEnv('NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY', '');
		initializeCheckoutSdk();
		expect(mocks.init).not.toHaveBeenCalled();
	});
	it('lê o valor oficial sem inventar um identificador', () => {
		vi.stubGlobal('MP_DEVICE_SESSION_ID', 'session-abc');
		expect(readCheckoutDeviceId()).toBe('session-abc');
	});
	it.each([undefined, '', 'a\r\nb', 'a'.repeat(513)])('omite identificador ausente ou inválido %#', (value) => {
		vi.stubGlobal('MP_DEVICE_SESSION_ID', value);
		expect(readCheckoutDeviceId()).toBeUndefined();
	});
});

describe('carregamento do antifraude', () => {
	const selector = 'script[src="https://www.mercadopago.com/v2/security.js"]';
	it('carrega o script oficial uma única vez com view checkout', () => {
		vi.stubEnv('NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY', 'TEST-security');
		initializeCheckoutSecurity();
		initializeCheckoutSecurity();
		expect(document.querySelectorAll(selector)).toHaveLength(1);
		expect(document.querySelector(selector)?.getAttribute('view')).toBe('checkout');
	});
	it('não carrega sem chave pública', () => {
		vi.stubEnv('NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY', '');
		initializeCheckoutSecurity();
		expect(document.querySelector(selector)).toBeNull();
	});
	it('permite recuperar falha de carregamento', () => {
		vi.stubEnv('NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY', 'TEST-security');
		initializeCheckoutSecurity();
		document.querySelector(selector)?.dispatchEvent(new Event('error'));
		expect(document.querySelector(selector)).toBeNull();
		initializeCheckoutSecurity();
		expect(document.querySelectorAll(selector)).toHaveLength(1);
	});
	it('retorna imediatamente um identificador válido já existente', async () => {
		vi.stubGlobal('MP_DEVICE_SESSION_ID', 'session-existing');
		await expect(waitForCheckoutDeviceId()).resolves.toBe('session-existing');
	});
	it('aguarda identificador gerado de forma assíncrona', async () => {
		vi.stubEnv('NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY', 'TEST-security');
		vi.useFakeTimers();
		const result = waitForCheckoutDeviceId();
		await vi.advanceTimersByTimeAsync(200);
		vi.stubGlobal('MP_DEVICE_SESSION_ID', 'session-delayed');
		await vi.advanceTimersByTimeAsync(100);
		await expect(result).resolves.toBe('session-delayed');
	});
	it('encerra a espera sem inventar identificador se o script não responder', async () => {
		vi.stubEnv('NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY', 'TEST-security');
		vi.useFakeTimers();
		const result = waitForCheckoutDeviceId();
		await vi.advanceTimersByTimeAsync(1500);
		await expect(result).resolves.toBeUndefined();
	});
});

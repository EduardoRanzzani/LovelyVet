'use client';

import { initMercadoPago } from '@mercadopago/sdk-react';
import { mercadoPagoDeviceIdSchema } from '@/api/schema/online-payment.schema';

let initializedKey: string | undefined;

// Compartilhado entre Pix e Brick. Nenhuma inicialização no servidor.
export function initializeCheckoutSdk() {
	const key = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY?.trim();
	if (typeof window === 'undefined' || !key || initializedKey === key) return;
	try {
		initMercadoPago(key, { locale: 'pt-BR' });
		initializedKey = key;
	} catch {
		// Antifraude indisponível não inventa um identificador nem impede Pix.
	}
}

export function readCheckoutDeviceId(): string | undefined {
	if (typeof window === 'undefined') return undefined;
	const value = (window as Window & { MP_DEVICE_SESSION_ID?: unknown }).MP_DEVICE_SESSION_ID;
	const parsed = mercadoPagoDeviceIdSchema.safeParse(value);
	return parsed.success ? parsed.data : undefined;
}

const SECURITY_SCRIPT_URL = 'https://www.mercadopago.com/v2/security.js';

// Carregar somente no checkout habilitado; reutilizar o script em navegações SPA.
export function initializeCheckoutSecurity(): void {
	if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY?.trim()) return;
	if (readCheckoutDeviceId()) return;
	if (Array.from(document.scripts).some((script) => script.src === SECURITY_SCRIPT_URL)) return;
	const script = document.createElement('script');
	script.src = SECURITY_SCRIPT_URL;
	script.async = true;
	script.setAttribute('view', 'checkout');
	// Permitir nova tentativa em uma navegação futura caso o recurso falhe.
	script.addEventListener('error', () => script.remove(), { once: true });
	document.head.appendChild(script);
}

// O evento load não garante que o identificador assíncrono já foi gerado.
// Espera limitada: o antifraude é opcional e não deve impedir o pagamento.
export async function waitForCheckoutDeviceId(): Promise<string | undefined> {
	const existing = readCheckoutDeviceId();
	if (existing || typeof window === 'undefined' || !process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY?.trim())
		return existing;
	initializeCheckoutSecurity();
	for (let attempt = 0; attempt < 15; attempt += 1) {
		await new Promise<void>((resolve) => window.setTimeout(resolve, 100));
		const deviceId = readCheckoutDeviceId();
		if (deviceId) return deviceId;
	}
	return undefined;
}

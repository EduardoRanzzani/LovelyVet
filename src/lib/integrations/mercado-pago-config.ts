import 'server-only';

import type { OnlinePaymentEnvironment } from '@/lib/finance/online-payment-scope';
import { getClerkEnvironment } from '@/lib/integrations/clerk-environment';

function required(name: string): string {
	const value = process.env[name]?.trim();
	if (!value) {
		throw new Error(`Variável de ambiente ${name} não configurada.`);
	}
	return value;
}

function booleanEnv(name: string, fallback?: boolean): boolean {
	const value = process.env[name];
	if (value === undefined && fallback !== undefined) return fallback;
	if (value === 'true') return true;
	if (value === 'false') return false;
	throw new Error(`Variável de ambiente ${name} deve ser "true" ou "false".`);
}

export function isMercadoPagoEnabled(): boolean {
	return booleanEnv('MERCADO_PAGO_ENABLED', false);
}

export function assertMercadoPagoEnabled(): void {
	if (!isMercadoPagoEnabled()) {
		throw new Error('Pagamentos online estão desabilitados.');
	}
}

export function getMercadoPagoEnvironment(): OnlinePaymentEnvironment {
	const environment = booleanEnv('MERCADO_PAGO_TEST_MODE') ? 'test' : 'production';
	const clerk = getClerkEnvironment();
	if (
		(environment === 'test' && clerk !== 'development') ||
		(environment === 'production' && clerk !== 'production')
	) {
		throw new Error('Ambientes Mercado Pago e Clerk incompatíveis.');
	}
	return environment;
}

// A flag controla novas cobranças, não a conciliação de tentativas já existentes.
export function getMercadoPagoConfig() {
	const environment = getMercadoPagoEnvironment();
	const collectorId = required('MERCADO_PAGO_COLLECTOR_ID');
	if (!/^[1-9][0-9]*$/.test(collectorId)) {
		throw new Error('MERCADO_PAGO_COLLECTOR_ID inválido.');
	}
	return {
		environment,
		collectorId,
		accessToken: required('MERCADO_PAGO_ACCESS_TOKEN'),
		webhookSecret: required('MERCADO_PAGO_WEBHOOK_SECRET'),
	};
}

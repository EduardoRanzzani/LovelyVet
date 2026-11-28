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

// A homologação utiliza uma conta de teste dedicada. O prefixo APP_USR não prova o ambiente.
// Consultar antes da reserva, sem cache e sem propagar dados/erros brutos do provedor.
export async function assertMercadoPagoTestCollector(config: ReturnType<typeof getMercadoPagoConfig>): Promise<void> {
	if (config.environment !== 'test') throw new Error('Conta de homologação obrigatória.');
	let account: unknown;
	try {
		const response = await fetch('https://api.mercadolibre.com/users/me', {
			method: 'GET',
			headers: { Authorization: `Bearer ${config.accessToken}`, Accept: 'application/json' },
			cache: 'no-store',
			redirect: 'error',
			signal: AbortSignal.timeout(10_000),
		});
		if (!response.ok) throw new Error('Consulta recusada.');
		account = await response.json();
	} catch {
		throw new Error('Não foi possível validar a conta Mercado Pago de homologação.');
	}
	if (!account || typeof account !== 'object') throw new Error('Conta Mercado Pago de homologação incompatível.');
	const { id, tags } = account as { id?: unknown; tags?: unknown };
	const validId = typeof id === 'string' || (typeof id === 'number' && Number.isSafeInteger(id));
	if (!validId || String(id) !== config.collectorId || !Array.isArray(tags) || !tags.includes('test_user')) {
		throw new Error('Conta Mercado Pago de homologação incompatível.');
	}
}

// Produção exige conta real e identidade esperada; APP_USR também existe em teste.
export async function assertMercadoPagoProductionCollector(
	config: ReturnType<typeof getMercadoPagoConfig>,
): Promise<void> {
	if (
		config.environment !== 'production' ||
		config.collectorId === '3648917376' ||
		!config.accessToken.startsWith('APP_USR-')
	) {
		throw new Error('Conta Mercado Pago de produção incompatível.');
	}
	let account: unknown;
	try {
		const response = await fetch('https://api.mercadolibre.com/users/me', {
			method: 'GET',
			headers: { Authorization: `Bearer ${config.accessToken}`, Accept: 'application/json' },
			cache: 'no-store',
			redirect: 'error',
			signal: AbortSignal.timeout(10_000),
		});
		if (!response.ok) throw new Error('Consulta recusada.');
		account = await response.json();
	} catch {
		throw new Error('Não foi possível validar a conta Mercado Pago de produção.');
	}
	if (!account || typeof account !== 'object') throw new Error('Conta Mercado Pago de produção incompatível.');
	const { id, tags } = account as { id?: unknown; tags?: unknown };
	const validId = typeof id === 'string' || (typeof id === 'number' && Number.isSafeInteger(id));
	if (
		!validId ||
		String(id) !== config.collectorId ||
		!Array.isArray(tags) ||
		!tags.every((tag) => typeof tag === 'string' && tag.length > 0) ||
		tags.includes('test_user')
	) {
		throw new Error('Conta Mercado Pago de produção incompatível.');
	}
}

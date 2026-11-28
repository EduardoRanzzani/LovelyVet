import 'server-only';

import { MercadoPagoConfig, Order } from 'mercadopago';
import { getMercadoPagoConfig } from './mercado-pago-config';

// Inicialização preguiçosa, cliente novo por operação: o SDK mescla requestOptions
// na configuração mutável (incluindo idempotência e identificador de dispositivo).
export function getMercadoPagoOrderClient(): Order {
	const { accessToken } = getMercadoPagoConfig();

	return new Order(
		new MercadoPagoConfig({
			accessToken,
			options: { timeout: 10_000 },
		}),
	);
}

// O valor é um inteiro positivo representável pelo integer do PostgreSQL.
export function formatMercadoPagoAmount(amountInCents: number): string {
	if (!Number.isInteger(amountInCents) || amountInCents <= 0 || amountInCents > 2_147_483_647) {
		throw new Error('Valor inválido para pagamento.');
	}
	return `${Math.floor(amountInCents / 100)}.${String(amountInCents % 100).padStart(2, '0')}`;
}

export type MercadoPagoOrderStatus =
	'created' | 'processing' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired' | 'review';

// Classificação preliminar da order; NÃO autoriza baixa nem transição de estado.
// A conciliação deve validar a transação, o valor, a conta e o ambiente.
export function normalizeMercadoPagoOrderStatus(status: unknown, detail: unknown): MercadoPagoOrderStatus {
	if (status === 'created' && detail === 'created') return 'created';
	if (status === 'processing' && detail === 'in_process') return 'processing';
	if (status === 'processed' && detail === 'accredited') return 'approved';
	if (
		status === 'action_required' &&
		(detail === 'waiting_payment' ||
			detail === 'waiting_capture' ||
			detail === 'waiting_transfer' ||
			detail === 'waiting_retry' ||
			detail === 'pending_challenge')
	)
		return 'pending';
	if ((status === 'canceled' || status === 'failed') && detail === 'expired') return 'expired';
	if (status === 'canceled' && detail === 'canceled') return 'cancelled';
	if (status === 'failed' && detail === 'failed') return 'rejected';
	// Estornos, contestações e combinações desconhecidas requerem revisão.
	return 'review';
}

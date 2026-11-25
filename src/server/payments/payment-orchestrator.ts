import 'server-only';
import type { OnlinePaymentInput } from '@/api/schema/online-payment.schema';
import { buildOrderRequest, readOrderIdentifiers, type ReservedPayment } from './order-request';

type Dependencies = {
	reserve: () => Promise<ReservedPayment>;
	createOrder: (request: ReturnType<typeof buildOrderRequest>) => Promise<unknown>;
	persist: (attempt: ReservedPayment, identifiers: ReturnType<typeof readOrderIdentifiers>) => Promise<void>;
	markUncertain: (attempt: ReservedPayment) => Promise<void>;
};

// A reserva é confirmada antes da rede. Uma falha ambígua nunca libera o saldo.
export async function submitOnlinePayment(input: OnlinePaymentInput, deps: Dependencies) {
	const attempt = await deps.reserve();
	try {
		const response = await deps.createOrder(buildOrderRequest(attempt, input));
		await deps.persist(attempt, readOrderIdentifiers(response, attempt));
	} catch {
		// Não encaminhar o erro do SDK ao logger de server actions (pode conter token/CPF).
		try {
			await deps.markUncertain(attempt);
		} catch {
			/* A reserva permanece bloqueada. */
		}
		return { attemptId: attempt.id, status: 'processing' as const, needsReconciliation: true };
	}
	return { attemptId: attempt.id, status: 'processing' as const, needsReconciliation: true };
}

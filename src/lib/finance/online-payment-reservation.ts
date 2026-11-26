import type { OnlinePaymentInput } from '@/api/schema/online-payment.schema';
import { calculateChargeBalance } from './ledger';

// Review bloqueia novas tentativas até resolução humana; approved também bloqueia
// até o próximo bloco definir a conciliação e a política de reversões.
const TERMINAL_ONLINE_PAYMENT_STATUSES = ['cancelled', 'rejected', 'expired'] as const;

export function assertNoBlockingOnlinePayment(attempts: readonly { status: string }[]) {
	if (attempts.some(({ status }) => !TERMINAL_ONLINE_PAYMENT_STATUSES.some((value) => value === status))) {
		throw new Error('Existe um pagamento online aguardando resolução para esta cobrança.');
	}
}

export function getOnlinePaymentAmount(
	charge: { status: string; totalInCents: number },
	payments: readonly { amountInCents: number }[],
) {
	if (charge.status !== 'open') throw new Error('Cobrança não está aberta.');
	const { balanceInCents } = calculateChargeBalance(charge.totalInCents, payments);
	if (balanceInCents <= 0) throw new Error('Cobrança já quitada.');
	return balanceInCents;
}

// Comparar somente após calcular o saldo autoritativo sob o lock do atendimento.
export function assertExpectedOnlinePaymentBalance(input: OnlinePaymentInput, balanceInCents: number): void {
	if (input.method === 'credit_card' && input.expectedBalanceInCents !== balanceInCents) {
		throw new Error('O saldo da cobrança mudou. Atualize a página antes de tentar novamente.');
	}
}

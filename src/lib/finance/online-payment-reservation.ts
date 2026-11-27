import type { OnlinePaymentInput } from '@/api/schema/online-payment.schema';
import { assertPaymentAmount, calculateChargeBalance } from './ledger';

const TERMINAL_ONLINE_PAYMENT_STATUSES = ['cancelled', 'rejected', 'expired'] as const;

type Attempt = { status: string; id?: string; amountInCents?: number; method?: string };
type Receipt = {
	onlinePaymentAttemptId: string | null;
	operationKey: string;
	amountInCents: number;
	method: string;
	source: string;
};

// A aprovação só deixa de bloquear quando há exatamente um recebimento compatível.
export function isBlockingOnlinePayment(attempt: Attempt, payments: readonly Receipt[] = []) {
	if (TERMINAL_ONLINE_PAYMENT_STATUSES.some((value) => value === attempt.status)) return false;
	if (attempt.status !== 'approved' || !attempt.id) return true;
	const linked = payments.filter((payment) => payment.onlinePaymentAttemptId === attempt.id);
	return (
		linked.length !== 1 ||
		linked[0]?.operationKey !== attempt.id ||
		linked[0]?.source !== 'mercado_pago' ||
		linked[0]?.amountInCents !== attempt.amountInCents ||
		linked[0]?.method !== attempt.method
	);
}

export function assertNoBlockingOnlinePayment(attempts: readonly Attempt[], payments: readonly Receipt[] = []) {
	if (attempts.some((attempt) => isBlockingOnlinePayment(attempt, payments))) {
		throw new Error('Existe um pagamento online aguardando resolução para esta cobrança.');
	}
}

export function getOnlinePaymentAmount(
	charge: { status: string; totalInCents: number },
	payments: readonly { amountInCents: number }[],
	input?: OnlinePaymentInput,
) {
	if (charge.status !== 'open') throw new Error('Cobrança não está aberta.');
	const { balanceInCents } = calculateChargeBalance(charge.totalInCents, payments);
	if (balanceInCents <= 0) throw new Error('Cobrança já quitada.');
	if (input) assertExpectedOnlinePaymentBalance(input, balanceInCents);
	const amount = input?.amountInCents ?? balanceInCents;
	assertPaymentAmount(balanceInCents, amount);
	return amount;
}

// Comparar somente após calcular o saldo autoritativo sob o lock do atendimento.
export function assertExpectedOnlinePaymentBalance(input: OnlinePaymentInput, balanceInCents: number): void {
	if (
		(input.method === 'credit_card' ||
			input.amountInCents !== undefined ||
			input.expectedBalanceInCents !== undefined) &&
		input.expectedBalanceInCents !== balanceInCents
	) {
		throw new Error('O saldo da cobrança mudou. Atualize a página antes de tentar novamente.');
	}
}

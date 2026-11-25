export type PaymentEntry = { amountInCents: number };
export type ChargeStatus = 'pending' | 'partial' | 'paid' | 'void';

export function calculateChargeBalance(totalInCents: number, payments: readonly PaymentEntry[], voided = false) {
	if (!Number.isSafeInteger(totalInCents) || totalInCents <= 0) throw new Error('Total da cobrança inválido');
	let paidInCents = 0;
	for (const payment of payments) {
		if (!Number.isSafeInteger(payment.amountInCents) || payment.amountInCents <= 0)
			throw new Error('Pagamento inválido');
		paidInCents += payment.amountInCents;
		if (!Number.isSafeInteger(paidInCents) || paidInCents > totalInCents)
			throw new Error('Pagamentos excedem a cobrança');
	}
	if (voided && paidInCents > 0) throw new Error('Cobrança com pagamentos não pode ser cancelada');
	const balanceInCents = totalInCents - paidInCents;
	const status: ChargeStatus = voided
		? 'void'
		: balanceInCents === 0
			? 'paid'
			: paidInCents > 0
				? 'partial'
				: 'pending';
	return { totalInCents, paidInCents, balanceInCents, status };
}

export function assertPaymentAmount(balanceInCents: number, amountInCents: number) {
	if (!Number.isSafeInteger(amountInCents) || amountInCents <= 0 || amountInCents > balanceInCents) {
		throw new Error('Pagamento deve ser positivo e não pode exceder o saldo');
	}
}

export function assertChargeableAppointment(appointment: {
	status: string;
	isPaid: boolean;
	totalPriceInCents: number;
}) {
	if (
		appointment.status !== 'completed' ||
		appointment.isPaid ||
		!Number.isSafeInteger(appointment.totalPriceInCents) ||
		appointment.totalPriceInCents <= 0
	) {
		throw new Error('Só atendimentos realizados, não pagos e com valor positivo podem ser faturados.');
	}
}
export function assertTutorIsLinked(links: readonly { customerId: string }[], customerId: string) {
	if (!links.some((link) => link.customerId === customerId))
		throw new Error('O tutor não está vinculado ao paciente.');
}

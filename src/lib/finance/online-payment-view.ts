export type OnlinePaymentOption = {
	canStart: boolean;
	attemptId: string | null;
	testMode: boolean;
};

export type OnlinePaymentSnapshot = {
	attemptId: string;
	status: string;
	amountInCents: number;
	method: string;
	installments: number;
	balanceInCents: number;
	pix: { code: string; pngBase64: string | null; expiresAt?: string } | null;
	// O servidor confirma que o Pix anterior ainda pode ser exibido durante o cooldown remoto.
	retainPix: boolean;
	remoteUnavailable: boolean;
	retryAfterSeconds: number;
};

export function canOfferOnlinePayment(charge: { status: string; balanceInCents: number }, appointmentStatus: string) {
	return (
		charge.status === 'open' &&
		appointmentStatus === 'completed' &&
		Number.isSafeInteger(charge.balanceInCents) &&
		charge.balanceInCents > 0
	);
}

export function isActivePaymentStatus(status: string) {
	return status === 'created' || status === 'processing' || status === 'pending';
}

export function paymentStatusMessage(status: string) {
	switch (status) {
		case 'approved':
			return 'Pagamento confirmado. Consulte o saldo atualizado.';
		case 'pending':
			return 'Aguardando pagamento.';
		case 'created':
		case 'processing':
			return 'Pagamento em processamento. Não inicie outro pagamento.';
		case 'rejected':
			return 'Pagamento recusado.';
		case 'cancelled':
			return 'Pagamento cancelado.';
		case 'expired':
			return 'Pagamento expirado.';
		default:
			return 'Pagamento em revisão. Entre em contato com a clínica.';
	}
}

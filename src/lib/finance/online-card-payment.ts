import { onlinePaymentSchema, type OnlinePaymentInput } from '@/api/schema/online-payment.schema';

export type CardPaymentPayload = Extract<OnlinePaymentInput, { method: 'credit_card' }>;

type CardForm = {
	token: unknown;
	payment_method_id: unknown;
	installments: unknown;
	transaction_amount: unknown;
	payer?: { identification?: { type?: unknown; number?: unknown } };
};

// Whitelist: never forward the full form, payer email, amount, issuer, BIN or card data.
export function buildCardPaymentPayload(
	chargeId: string,
	balanceInCents: number,
	form: CardForm,
	paymentType: unknown,
): CardPaymentPayload | null {
	if (
		paymentType !== 'credit_card' ||
		!Number.isSafeInteger(balanceInCents) ||
		balanceInCents <= 0 ||
		form.transaction_amount !== balanceInCents / 100
	)
		return null;
	const document = form.payer?.identification;
	const identification = document
		? {
				type: document.type,
				number:
					typeof document.number === 'string' ? document.number.replace(/[.\/\s-]/g, '') : document.number,
			}
		: undefined;
	const parsed = onlinePaymentSchema.safeParse({
		chargeId,
		method: 'credit_card',
		expectedBalanceInCents: balanceInCents,
		token: form.token,
		paymentMethodId: form.payment_method_id,
		installments: form.installments,
		...(identification ? { identification } : {}),
	});
	return parsed.success && parsed.data.method === 'credit_card' ? parsed.data : null;
}

import { formatCurrencyFromCents } from '@/helpers/currency';

/** The buyer-paid total is not an installment schedule. */
export function formatPaymentInstallments(installments: number, totalPaidInCents: number | null): string {
	if (!Number.isSafeInteger(installments) || installments < 1) return 'Não informado';
	if (installments === 1) return 'À vista';
	const count = `${installments}x`;
	if (totalPaidInCents === null || !Number.isSafeInteger(totalPaidInCents) || totalPaidInCents <= 0) {
		return count;
	}
	const average = Math.round(totalPaidInCents / installments);
	return `${count} de ${totalPaidInCents % installments === 0 ? '' : 'aproximadamente '}${formatCurrencyFromCents(average)}`;
}

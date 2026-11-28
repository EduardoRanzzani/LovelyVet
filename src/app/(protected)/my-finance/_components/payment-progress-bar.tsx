import { formatCurrencyFromCents } from '@/helpers/currency';
import type { PaymentConfirmation } from '@/lib/finance/online-payment-view';

const methods = [
	{ key: 'credit_card', label: 'Cartão de crédito', color: 'bg-emerald-600' },
	{ key: 'pix', label: 'Pix', color: 'bg-accent' },
	{ key: 'debit_card', label: 'Cartão de débito', color: 'bg-emerald-800' },
	{ key: 'cash', label: 'Dinheiro', color: 'bg-emerald-600' },
	{ key: 'other', label: 'Outros métodos', color: 'bg-emerald-300' },
] as const;

export function PaymentProgressBar({
	confirmation,
}: {
	confirmation: Pick<PaymentConfirmation, 'totalInCents' | 'paidInCents' | 'receipts'>;
}) {
	const { totalInCents, paidInCents, receipts } = confirmation;
	const validTotal = Number.isSafeInteger(totalInCents) && totalInCents > 0;
	const validPaid = Number.isSafeInteger(paidInCents) && paidInCents >= 0;
	const progress = validTotal && validPaid ? Math.min(100, Math.floor((paidInCents / totalInCents) * 100)) : 0;
	const grouped = new Map<string, number>();
	let receiptTotal = 0;
	let validReceipts = true;
	for (const receipt of receipts) {
		if (!Number.isSafeInteger(receipt.amountInCents) || receipt.amountInCents <= 0) {
			validReceipts = false;
			continue;
		}
		const key = methods.some((method) => method.key === receipt.method) ? receipt.method : 'other';
		grouped.set(key, (grouped.get(key) ?? 0) + receipt.amountInCents);
		receiptTotal += receipt.amountInCents;
	}
	// Não inventar a composição quando o histórico não corresponde ao total contábil.
	const segmented =
		validTotal && validPaid && validReceipts && receiptTotal === paidInCents && paidInCents <= totalInCents;
	const segments = segmented
		? methods.flatMap((method) => {
				const amount = grouped.get(method.key) ?? 0;
				return amount > 0 ? [{ ...method, amount }] : [];
			})
		: [];
	const balance = validTotal && validPaid ? Math.max(0, totalInCents - paidInCents) : 0;
	const money = formatCurrencyFromCents;

	return (
		<section aria-label='Progresso do pagamento' className='space-y-2 border-t pt-4'>
			<div className='flex justify-between gap-2 text-sm font-medium'>
				<span>Progresso do pagamento</span>
				<span>{progress}% pago</span>
			</div>
			<progress className='sr-only' value={progress} max={100} aria-label='Percentual pago da cobrança' />
			<div aria-hidden='true' className='flex h-3 w-full overflow-hidden rounded-full bg-zinc-200'>
				{segmented ? (
					segments.map((segment) => (
						<div
							key={segment.key}
							className={`h-full shrink-0 ${segment.color}`}
							style={{ width: `${(segment.amount / totalInCents) * 100}%` }}
						/>
					))
				) : (
					<div className='h-full bg-emerald-600' style={{ width: `${progress}%` }} />
				)}
			</div>
			<div className='flex flex-wrap justify-between gap-2 text-xs text-muted-foreground'>
				<span>{money(paidInCents)} pagos</span>
				<span>Total: {money(totalInCents)}</span>
			</div>
			{segmented && (
				<ul
					aria-label='Composição dos pagamentos'
					className='flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground'
				>
					{segments.map((segment) => (
						<li key={segment.key} className='flex items-center gap-1.5'>
							<span aria-hidden='true' className={`size-2.5 shrink-0 rounded-sm ${segment.color}`} />
							<span>{`${segment.label} · ${money(segment.amount)}`}</span>
						</li>
					))}
					{balance > 0 && (
						<li className='flex items-center gap-1.5'>
							<span aria-hidden='true' className='size-2.5 shrink-0 rounded-sm bg-zinc-200' />
							<span>{`Em aberto · ${money(balance)}`}</span>
						</li>
					)}
				</ul>
			)}
		</section>
	);
}

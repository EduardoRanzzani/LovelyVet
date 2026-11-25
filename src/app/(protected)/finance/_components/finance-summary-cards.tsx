import { Clock3, FileText, Receipt, Wallet } from 'lucide-react';
import { formatCurrencyFromCents } from '@/helpers/currency';

type FinanceSummaryCardsProps = {
	billedInCents: number;
	receivedInCents: number;
	outstandingInCents: number;
	invoicedCount: number;
};

export function FinanceSummaryCards({
	billedInCents,
	receivedInCents,
	outstandingInCents,
	invoicedCount,
}: FinanceSummaryCardsProps) {
	const cards = [
		{
			label: 'Faturado no mês',
			value: formatCurrencyFromCents(billedInCents),
			Icon: Receipt,
			iconClass: 'bg-muted text-muted-foreground',
			valueClass: 'text-foreground',
		},
		{
			label: 'Recebido no mês',
			value: formatCurrencyFromCents(receivedInCents),
			Icon: Wallet,
			iconClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
			valueClass: 'text-emerald-800 dark:text-emerald-300',
		},
		{
			label: 'Saldo total em aberto',
			value: formatCurrencyFromCents(outstandingInCents),
			Icon: Clock3,
			iconClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
			valueClass: outstandingInCents > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-foreground',
		},
		{
			label: 'Cobranças válidas no mês',
			value: String(invoicedCount),
			Icon: FileText,
			iconClass: 'bg-muted text-muted-foreground',
			valueClass: 'text-foreground',
		},
	];

	return (
		<div className='@container min-w-0'>
			<div
				data-testid='finance-summary-grid'
				className='grid min-w-0 grid-cols-1 gap-2 @min-[300px]:grid-cols-2 @min-[900px]:grid-cols-4 @min-[900px]:gap-3'
			>
				{cards.map(({ label, value, Icon, iconClass, valueClass }) => (
					<section
						key={label}
						aria-label={label}
						className='flex min-w-0 flex-col gap-2 rounded-xl border bg-card p-3 shadow-sm @min-[900px]:p-4'
					>
						<div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
							<Icon aria-hidden='true' className='size-4' />
						</div>
						<p className='text-xs leading-snug text-muted-foreground wrap-anywhere @min-[900px]:text-sm'>
							{label}
						</p>
						<p
							className={`mt-auto min-w-0 text-lg font-bold leading-tight tabular-nums wrap-anywhere @min-[900px]:text-2xl ${valueClass}`}
						>
							{value}
						</p>
					</section>
				))}
			</div>
		</div>
	);
}

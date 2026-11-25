import { Badge } from '@/components/ui/badge';
import type { ChargeStatus } from '@/lib/finance/ledger';

const statusPresentation = {
	pending: {
		label: 'Pendente',
		className: 'border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
	},
	partial: {
		label: 'Parcialmente paga',
		className: 'border-sky-200 bg-sky-100 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200',
	},
	paid: {
		label: 'Paga',
		className: 'border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
	},
	void: {
		label: 'Cancelada',
		className: 'border-rose-200 bg-rose-100 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200',
	},
} satisfies Record<ChargeStatus, { label: string; className: string }>;

export function ChargeStatusBadge({ status }: { status: ChargeStatus }) {
	const presentation = statusPresentation[status];
	return (
		<Badge variant='outline' className={`${presentation.className} max-w-full whitespace-normal text-center`}>
			{presentation.label}
		</Badge>
	);
}

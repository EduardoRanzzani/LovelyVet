import type { ReactNode } from 'react';
import { ChargeStatusBadge } from '@/components/shared/charge-status-badge';
import { formatCurrencyFromCents } from '@/helpers/currency';
import { getMonthBounds, type FinancialStatementRow } from '@/lib/finance/financial-report';
import type { StatementItem } from '@/lib/finance/customer-statement';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
	timeZone: 'America/Campo_Grande',
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
});
const paymentMethods: Record<string, string> = {
	pix: 'Pix',
	cash: 'Dinheiro',
	credit_card: 'Cartão de crédito',
	debit_card: 'Cartão de débito',
	transfer: 'Transferência',
};
const currency = formatCurrencyFromCents;

export function CustomerChargeCard({
	charge,
	items,
	month,
	paymentAction,
}: {
	charge: FinancialStatementRow;
	items: readonly StatementItem[];
	month: string;
	paymentAction?: ReactNode;
}) {
	const { start, end } = getMonthBounds(month);
	const inMonth = (date: Date) => date >= start && date < end;
	const totals = [
		['Total da cobrança', charge.totalInCents],
		['Pago até hoje', charge.paidInCents],
		['Saldo atual', charge.balanceInCents],
	] as const;
	return (
		<article className='@container min-w-0 space-y-4 rounded-xl border bg-card p-3 shadow-sm sm:p-4'>
			<div className='flex min-w-0 flex-wrap items-start justify-between gap-2'>
				<div className='min-w-0 space-y-1'>
					<h3 className='font-semibold wrap-anywhere'>{charge.petName}</h3>
					<p className='text-xs text-muted-foreground'>Emitida em {dateFormatter.format(charge.createdAt)}</p>
					{!inMonth(charge.createdAt) && (
						<p className='text-xs text-muted-foreground'>Emitida fora do mês selecionado</p>
					)}
				</div>
				<ChargeStatusBadge status={charge.financialStatus} />
			</div>
			<dl className='grid min-w-0 grid-cols-1 gap-2 @min-[340px]:grid-cols-3'>
				{totals.map(([label, amount]) => (
					<div key={label} className='min-w-0 rounded-lg bg-muted/50 p-2.5'>
						<dt className='text-xs text-muted-foreground'>{label}</dt>
						<dd className='mt-1 font-semibold tabular-nums wrap-anywhere'>{currency(amount)}</dd>
					</div>
				))}
			</dl>
			{paymentAction && <div className='border-t pt-3'>{paymentAction}</div>}
			<div className='space-y-2 border-t pt-3'>
				<h4 className='text-sm font-medium'>Serviços e produtos do atendimento</h4>
				{items.length === 0 ? (
					<p className='text-sm text-muted-foreground'>Não há itens disponíveis para exibição.</p>
				) : (
					<ul className='divide-y'>
						{items.map((item) => (
							<li
								key={`${item.kind}-${item.id}`}
								className='flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-1 py-2'
							>
								<div className='min-w-0 flex-1 basis-36'>
									<p className='text-sm font-medium wrap-anywhere'>{item.name}</p>
									<p className='text-xs text-muted-foreground wrap-anywhere'>
										{item.kind === 'service' ? 'Serviço' : 'Produto'} · {item.quantity} ×{' '}
										{currency(item.unitPriceInCents)}
									</p>
									{item.discountInCents > 0 && (
										<p className='text-xs text-muted-foreground'>
											Desconto: {currency(item.discountInCents)}
										</p>
									)}
								</div>
								<p className='min-w-0 text-sm font-medium tabular-nums wrap-anywhere'>
									{currency(item.quantity * item.unitPriceInCents - item.discountInCents)}
								</p>
							</li>
						))}
					</ul>
				)}
			</div>
			<div className='space-y-2 border-t pt-3'>
				<h4 className='text-sm font-medium'>Histórico de pagamentos da cobrança</h4>
				{charge.payments.length === 0 ? (
					<p className='text-sm text-muted-foreground'>Nenhum pagamento registrado.</p>
				) : (
					<ul className='divide-y'>
						{charge.payments.map((payment) => (
							<li
								key={payment.id}
								className='flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-1 py-2 text-sm'
							>
								<div className='min-w-0 flex-1 basis-36'>
									<p className='font-medium wrap-anywhere'>
										{paymentMethods[payment.method] ?? payment.method}
									</p>
									<p className='text-xs text-muted-foreground'>
										{dateFormatter.format(payment.receivedAt)}
									</p>
									<p className='text-xs text-muted-foreground'>
										{inMonth(payment.receivedAt) ? 'No mês selecionado' : 'Fora do mês selecionado'}
									</p>
								</div>
								<p className='min-w-0 font-medium tabular-nums wrap-anywhere'>
									{currency(payment.amountInCents)}
								</p>
							</li>
						))}
					</ul>
				)}
			</div>
		</article>
	);
}

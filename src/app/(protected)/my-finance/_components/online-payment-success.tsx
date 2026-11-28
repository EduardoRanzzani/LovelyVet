import Link from 'next/link';
import { ArrowLeft, CircleCheck, ClipboardList, CreditCard, History, QrCode, ReceiptText, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrencyFromCents } from '@/helpers/currency';
import { formatPaymentInstallments } from '@/lib/finance/payment-installment-label';
import type { StatementItem } from '@/lib/finance/customer-statement';
import type { OnlinePaymentSnapshot } from '@/lib/finance/online-payment-view';

type Props = {
	payment: OnlinePaymentSnapshot;
	petName: string;
	returnHref: string;
	testMode?: boolean;
	items?: readonly StatementItem[];
	onContinue?: () => void;
	historical?: boolean;
	receivedAtLabel?: string;
};

export function OnlinePaymentSuccess({
	payment,
	petName,
	returnHref,
	testMode,
	items,
	onContinue,
	historical = false,
	receivedAtLabel,
}: Props) {
	const method =
		payment.method === 'pix'
			? 'Pix'
			: payment.method === 'credit_card'
				? 'Cartão de crédito'
				: payment.method === 'debit_card'
					? 'Cartão de débito'
					: 'Pagamento online';
	const confirmation = payment.confirmation;
	const totalPaid = confirmation?.providerPaidAmountInCents ?? null;
	const surcharge = totalPaid === null ? null : totalPaid - payment.amountInCents;
	const progress =
		confirmation && confirmation.totalInCents > 0
			? Math.min(100, Math.max(0, Math.floor((confirmation.paidInCents / confirmation.totalInCents) * 100)))
			: 0;
	const ownReceipts = confirmation?.receipts.filter((receipt) => receipt.ownOnline) ?? [];
	const ownTotal =
		ownReceipts.length > 0 && ownReceipts.every((receipt) => receipt.providerPaidAmountInCents !== null)
			? ownReceipts.reduce((sum, receipt) => sum + (receipt.providerPaidAmountInCents ?? 0), 0)
			: null;
	const ownSurcharge =
		ownTotal === null ? null : ownTotal - ownReceipts.reduce((sum, receipt) => sum + receipt.amountInCents, 0);
	const money = formatCurrencyFromCents;
	const labels: Record<string, string> = {
		pix: 'Pix',
		credit_card: 'Cartão de crédito',
		debit_card: 'Cartão de débito',
		cash: 'Dinheiro',
		transfer: 'Transferência',
	};
	return (
		<div className='space-y-4'>
			<section aria-label='Confirmação do pagamento' className='space-y-4 rounded-xl border bg-card p-4 sm:p-6'>
				<div role='status' className='flex items-start gap-3'>
					<div className='flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800'>
						<CircleCheck aria-hidden='true' className='size-7' />
					</div>
					<div className='min-w-0 space-y-1'>
						<h2 className='text-xl font-semibold text-emerald-800'>Pagamento aprovado!</h2>
						<p className='text-sm text-muted-foreground'>
							{historical
								? 'Este pagamento foi confirmado com sucesso.'
								: payment.balanceInCents > 0
									? 'Seu pagamento parcial foi confirmado com sucesso.'
									: 'Seu pagamento foi confirmado com sucesso.'}
						</p>
						{receivedAtLabel && (
							<p className='text-xs text-muted-foreground'>
								Recebimento confirmado em {receivedAtLabel}.
							</p>
						)}
					</div>
				</div>
				{historical && (
					<p className='text-xs text-muted-foreground'>
						O resumo e o saldo da cobrança refletem a situação atual.
					</p>
				)}
				<dl aria-label='Valores do pagamento' className='grid gap-3 border-t pt-4 sm:grid-cols-2'>
					<div className='min-w-0 space-y-1 rounded-lg bg-emerald-50 p-3 text-emerald-900'>
						<dt className='text-sm'>Valor total pago</dt>
						<dd className='text-2xl font-semibold tabular-nums wrap-anywhere'>
							{totalPaid === null ? 'Indisponível no momento' : money(totalPaid)}
						</dd>
						<dd className='text-xs'>
							{method}
							{payment.method === 'credit_card'
								? ` · ${formatPaymentInstallments(payment.installments, totalPaid)}`
								: ''}
						</dd>
					</div>
					<div
						className={
							payment.balanceInCents > 0
								? 'min-w-0 space-y-1 rounded-lg bg-amber-50 p-3 text-amber-900'
								: 'min-w-0 space-y-1 rounded-lg bg-muted p-3'
						}
					>
						<dt className='text-sm'>Saldo restante da cobrança</dt>
						<dd className='text-2xl font-semibold tabular-nums wrap-anywhere'>
							{money(payment.balanceInCents)}
						</dd>
						<dd className='text-xs'>
							{payment.balanceInCents > 0 ? 'Pagamento parcial' : 'Cobrança quitada'}
						</dd>
					</div>
				</dl>
				<dl className='space-y-2 text-sm'>
					<div className='flex justify-between gap-2'>
						<dt className='text-muted-foreground'>Principal creditado na cobrança</dt>
						<dd className='font-medium tabular-nums'>{money(payment.amountInCents)}</dd>
					</div>
					{surcharge !== null && surcharge > 0 && (
						<div className='flex justify-between gap-2'>
							<dt className='text-muted-foreground'>Acréscimos do parcelamento</dt>
							<dd className='font-medium tabular-nums'>{money(surcharge)}</dd>
						</div>
					)}
				</dl>
				{confirmation && (
					<section aria-label='Progresso do pagamento' className='space-y-2 border-t pt-4'>
						<div className='flex justify-between gap-2 text-sm font-medium'>
							<span>Progresso do pagamento</span>
							<span>{progress}% pago</span>
						</div>
						<progress
							className='h-2 w-full overflow-hidden rounded-full bg-muted accent-emerald-600 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-emerald-600 [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-emerald-600'
							value={progress}
							max={100}
							aria-label='Percentual pago da cobrança'
						/>
						<div className='flex flex-wrap justify-between gap-2 text-xs text-muted-foreground'>
							<span>{money(confirmation.paidInCents)} pagos</span>
							<span>Total: {money(confirmation.totalInCents)}</span>
						</div>
					</section>
				)}
			</section>
			<div
				className={items !== undefined ? 'grid min-w-0 items-start gap-4 lg:grid-cols-2' : 'grid min-w-0 gap-4'}
			>
				{items !== undefined && (
					<section
						aria-labelledby='payment-items-heading'
						className='min-w-0 space-y-3 rounded-xl border bg-card p-4'
					>
						<h3 id='payment-items-heading' className='flex items-center gap-2 text-sm font-semibold'>
							<ClipboardList aria-hidden='true' className='size-4 shrink-0 text-muted-foreground' />
							Serviços e produtos do atendimento
						</h3>
						{items.length === 0 ? (
							<p className='text-sm text-muted-foreground'>Não há itens disponíveis para exibição.</p>
						) : (
							<ul className='divide-y'>
								{items.map((item) => (
									<li
										key={`${item.kind}-${item.id}`}
										className='flex flex-wrap justify-between gap-2 py-2 text-sm'
									>
										<div className='min-w-0 flex-1'>
											<p className='font-medium wrap-anywhere'>{item.name}</p>
											<p className='text-xs text-muted-foreground'>
												{item.kind === 'service' ? 'Serviço' : 'Produto'} · {item.quantity} ×{' '}
												{money(item.unitPriceInCents)}
												{item.discountInCents > 0 &&
													` · Desconto: ${money(item.discountInCents)}`}
											</p>
										</div>
										<span className='font-medium tabular-nums'>
											{money(item.quantity * item.unitPriceInCents - item.discountInCents)}
										</span>
									</li>
								))}
							</ul>
						)}
						{payment.balanceInCents > 0 && (
							<p className='text-xs text-muted-foreground'>
								Os itens compõem a cobrança original; o pagamento parcial não quita itens
								individualmente.
							</p>
						)}
					</section>
				)}
				<section
					aria-labelledby='payment-details-heading'
					className='min-w-0 space-y-3 rounded-xl border bg-card p-4'
				>
					<h3 id='payment-details-heading' className='flex items-center gap-2 text-sm font-semibold'>
						<ReceiptText aria-hidden='true' className='size-4 shrink-0 text-muted-foreground' />
						Detalhes do pagamento
					</h3>
					<dl className='grid gap-4 text-sm sm:grid-cols-2'>
						<div className='min-w-0 space-y-1'>
							<dt className='text-muted-foreground'>Pet</dt>
							<dd className='font-medium wrap-anywhere'>{petName}</dd>
						</div>
						<div className='space-y-1'>
							<dt className='text-muted-foreground'>Forma de pagamento</dt>
							<dd className='font-medium'>{method}</dd>
						</div>
						{payment.method === 'credit_card' && (
							<div className='space-y-1'>
								<dt className='text-muted-foreground'>Parcelamento</dt>
								<dd className='font-medium'>
									{formatPaymentInstallments(payment.installments, totalPaid)}
								</dd>
							</div>
						)}
						<div className='space-y-1'>
							<dt className='text-muted-foreground'>Total pago nesta operação</dt>
							<dd className='font-medium'>{totalPaid === null ? 'Não informado' : money(totalPaid)}</dd>
						</div>
					</dl>
					{surcharge !== null && surcharge > 0 && (
						<p className='flex justify-between gap-2 rounded-lg bg-muted p-3 text-sm'>
							<span>Acréscimo do parcelamento</span>
							<strong>{money(surcharge)}</strong>
						</p>
					)}
				</section>
			</div>
			{confirmation && (
				<section aria-labelledby='payment-history-heading' className='space-y-3 rounded-xl border bg-card p-4'>
					<h3 id='payment-history-heading' className='flex items-center gap-2 text-sm font-semibold'>
						<History aria-hidden='true' className='size-4 shrink-0 text-muted-foreground' />
						Histórico de pagamentos da cobrança
					</h3>
					<p className='text-xs text-muted-foreground'>
						Valores creditados na cobrança. Detalhes de acréscimos somente dos seus pagamentos online.
					</p>
					<ul className='divide-y'>
						{confirmation.receipts.map((receipt, index) => (
							<li key={index} className='flex items-center justify-between gap-3 py-2 text-sm'>
								<div className='flex min-w-0 flex-1 items-center gap-3'>
									<div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
										{receipt.method === 'pix' ? (
											<QrCode aria-hidden='true' className='size-5' />
										) : receipt.method === 'credit_card' || receipt.method === 'debit_card' ? (
											<CreditCard aria-hidden='true' className='size-5' />
										) : (
											<Wallet aria-hidden='true' className='size-5' />
										)}
									</div>
									<div className='min-w-0'>
										<p className='font-medium'>
											{labels[receipt.method] ?? 'Pagamento'}
											{receipt.method === 'credit_card' &&
											receipt.installments &&
											receipt.installments > 1
												? ` · ${formatPaymentInstallments(receipt.installments, receipt.ownOnline ? receipt.providerPaidAmountInCents : null)}`
												: ''}
										</p>
										<p className='text-xs text-muted-foreground'>
											{receipt.current
												? historical
													? 'Pagamento deste comprovante'
													: 'Pagamento atual'
												: 'Recebimento confirmado'}
										</p>
									</div>
								</div>
								<div className='shrink-0 text-right'>
									<p className='font-medium tabular-nums'>{money(receipt.amountInCents)}</p>
									<p className='text-xs text-muted-foreground'>Principal</p>
									{receipt.ownOnline &&
										receipt.providerPaidAmountInCents !== null &&
										receipt.providerPaidAmountInCents > receipt.amountInCents && (
											<>
												<p className='text-xs text-muted-foreground'>
													Acréscimos:{' '}
													{money(receipt.providerPaidAmountInCents - receipt.amountInCents)}
												</p>
												<p className='text-xs font-medium'>
													Total pago: {money(receipt.providerPaidAmountInCents)}
												</p>
											</>
										)}
								</div>
							</li>
						))}
					</ul>
					<dl className='space-y-2 border-t pt-3 text-sm'>
						<div className='flex justify-between gap-2'>
							<dt>Total da cobrança</dt>
							<dd>{money(confirmation.totalInCents)}</dd>
						</div>
						<div className='flex justify-between gap-2'>
							<dt>Total pago da cobrança</dt>
							<dd>{money(confirmation.paidInCents)}</dd>
						</div>
						{ownSurcharge !== null && ownSurcharge > 0 && (
							<div className='flex justify-between gap-2'>
								<dt>Acréscimos dos seus pagamentos online</dt>
								<dd>{money(ownSurcharge)}</dd>
							</div>
						)}
						<div className='flex justify-between gap-2'>
							<dt>Total desembolsado online (com acréscimos)</dt>
							<dd>{ownTotal === null ? 'Indisponível' : money(ownTotal)}</dd>
						</div>
						{ownTotal === null && (
							<p className='text-xs text-muted-foreground'>
								O total desembolsado não está disponível para todos os seus pagamentos online. Isso não
								altera o saldo da cobrança.
							</p>
						)}
						<div className='flex justify-between gap-2 font-semibold'>
							<dt>Saldo em aberto</dt>
							<dd>{money(payment.balanceInCents)}</dd>
						</div>
					</dl>
				</section>
			)}
			<div className='flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between'>
				{payment.balanceInCents === 0 ? (
					<p className='flex items-center gap-2 text-sm font-medium text-emerald-800'>
						<CircleCheck aria-hidden='true' className='size-4 shrink-0' />
						Sua cobrança está quitada.
					</p>
				) : (
					<p className='text-sm text-muted-foreground'>Ainda existe saldo em aberto nesta cobrança.</p>
				)}
				<div className='flex flex-col gap-2 sm:flex-row'>
					<Button asChild variant={onContinue ? 'outline' : 'default'} className='w-full sm:w-auto'>
						<Link href={returnHref}>
							<ArrowLeft aria-hidden='true' />
							Voltar ao meu financeiro
						</Link>
					</Button>
					{onContinue && payment.balanceInCents > 0 && (
						<Button type='button' onClick={onContinue}>
							Pagar saldo restante
						</Button>
					)}
				</div>
			</div>
			{testMode && (
				<p className='rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900'>
					Ambiente de homologação. Não utilize pagamentos reais.
				</p>
			)}
		</div>
	);
}

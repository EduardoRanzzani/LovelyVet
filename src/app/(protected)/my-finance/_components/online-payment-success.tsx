import Link from 'next/link';
import { ArrowLeft, CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrencyFromCents } from '@/helpers/currency';
import type { OnlinePaymentSnapshot } from '@/lib/finance/online-payment-view';

type Props = {
	payment: OnlinePaymentSnapshot;
	petName: string;
	returnHref: string;
	testMode?: boolean;
};

export function OnlinePaymentSuccess({ payment, petName, returnHref, testMode }: Props) {
	const method =
		payment.method === 'pix'
			? 'Pix'
			: payment.method === 'credit_card'
				? 'Cartão de crédito'
				: payment.method === 'debit_card'
					? 'Cartão de débito'
					: 'Pagamento online';
	return (
		<div className='space-y-6'>
			<div role='status' className='flex items-start gap-3'>
				<div className='flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'>
					<CircleCheck aria-hidden='true' className='size-8' />
				</div>
				<div className='min-w-0 space-y-1'>
					<h2 className='text-xl font-semibold text-emerald-800 dark:text-emerald-200'>
						Pagamento aprovado!
					</h2>
					<p className='text-sm text-muted-foreground'>Seu pagamento foi confirmado com sucesso.</p>
				</div>
			</div>
			<dl aria-label='Valores do pagamento' className='grid gap-3 sm:grid-cols-2'>
				<div className='min-w-0 rounded-lg bg-emerald-50 p-4 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'>
					<dt className='text-sm'>Valor pago da cobrança</dt>
					<dd className='text-2xl font-semibold tabular-nums wrap-anywhere'>
						{formatCurrencyFromCents(payment.amountInCents)}
					</dd>
				</div>
				<div className='min-w-0 rounded-lg bg-muted p-4'>
					<dt className='text-sm text-muted-foreground'>Saldo restante</dt>
					<dd className='text-2xl font-semibold tabular-nums wrap-anywhere'>
						{formatCurrencyFromCents(payment.balanceInCents)}
					</dd>
				</div>
			</dl>
			<section aria-labelledby='payment-details-heading' className='space-y-3'>
				<h3 id='payment-details-heading' className='text-sm font-semibold'>
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
								{payment.installments === 1 ? 'À vista' : `${payment.installments}x`}
							</dd>
						</div>
					)}
					<div className='space-y-1'>
						<dt className='text-muted-foreground'>Intermediador</dt>
						<dd className='font-medium'>Mercado Pago</dd>
					</div>
				</dl>
			</section>
			<div className='flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between'>
				{payment.balanceInCents === 0 ? (
					<p className='flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-200'>
						<CircleCheck aria-hidden='true' className='size-4 shrink-0' />
						Sua cobrança está quitada.
					</p>
				) : (
					<p className='text-sm text-muted-foreground'>Ainda existe saldo em aberto nesta cobrança.</p>
				)}
				<Button asChild className='w-full sm:w-auto'>
					<Link href={returnHref}>
						<ArrowLeft aria-hidden='true' />
						Voltar ao meu financeiro
					</Link>
				</Button>
			</div>
			{testMode && (
				<p className='rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'>
					Ambiente de homologação. Não utilize pagamentos reais.
				</p>
			)}
		</div>
	);
}

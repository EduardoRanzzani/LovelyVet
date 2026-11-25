import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { ChargeStatusBadge } from '@/components/shared/charge-status-badge';
import {
	PageContainer,
	PageContent,
	PageHeader,
	PageHeaderContent,
	PageTitle,
} from '@/components/shared/page-container';
import { formatCurrencyFromCents } from '@/helpers/currency';
import { requirePageAccess } from '@/lib/security/authorization';
import { getOwnFinancialCharge } from '@/lib/finance/financial-report-queries';
import { getOwnStatementItems } from '@/lib/finance/customer-statement-queries';
import { resolveStatementMonth } from '@/lib/finance/customer-statement';
import { getOwnOnlinePaymentOptions } from '@/lib/finance/online-payment-options';
import { OnlinePaymentCheckout } from '../../_components/online-payment-checkout';

export default async function PaymentPage({
	params,
	searchParams,
}: {
	params: Promise<{ chargeId: string }>;
	searchParams: Promise<{ month?: string | string[]; scope?: string | string[] }>;
}) {
	const context = await requirePageAccess('/my-finance');
	if (context.role !== 'customer' || !context.customerId) notFound();
	const { chargeId } = await params;
	if (!z.uuid().safeParse(chargeId).success) notFound();
	const { month, scope } = await searchParams;
	const selected = resolveStatementMonth(month);
	const selectedScope = scope === 'all' ? 'all' : 'month';
	const charge = await getOwnFinancialCharge(selected, chargeId);
	// Não diferencia cobrança inexistente de cobrança de outro tutor.
	if (!charge) notFound();
	const [itemsByCharge, options] = await Promise.all([
		getOwnStatementItems([charge.id]),
		getOwnOnlinePaymentOptions(context, [charge]),
	]);
	const items = itemsByCharge.get(charge.id) ?? [];
	const option = options.get(charge.id);
	const currency = formatCurrencyFromCents;
	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Realizar pagamento</PageTitle>
				</PageHeaderContent>
			</PageHeader>
			<PageContent>
				<div className='w-full min-w-0 space-y-4'>
					<Button asChild variant='ghost' className='w-fit'>
						<Link href={`/my-finance?month=${selected}&scope=${selectedScope}`}>
							<ArrowLeft /> Voltar ao meu financeiro
						</Link>
					</Button>
					<div className='grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-6'>
						<section
							aria-label='Resumo da cobrança'
							className='min-w-0 space-y-4 rounded-xl border bg-card p-4 shadow-sm sm:p-6 lg:col-start-2 lg:row-start-1'
						>
							<h2 className='text-lg font-semibold'>Resumo da cobrança</h2>
							<div className='flex flex-wrap items-start justify-between gap-2'>
								<div className='min-w-0'>
									<h3 className='font-semibold wrap-anywhere'>{charge.petName}</h3>
									<p className='text-xs text-muted-foreground'>Atendimento veterinário</p>
								</div>
								<ChargeStatusBadge status={charge.financialStatus} />
							</div>
							<div className='space-y-2 border-t pt-3'>
								<h3 className='text-sm font-medium'>Serviços e produtos</h3>
								{items.length === 0 ? (
									<p className='text-sm text-muted-foreground'>
										Não há itens disponíveis para exibição.
									</p>
								) : (
									<ul className='divide-y'>
										{items.map((item) => (
											<li
												key={`${item.kind}-${item.id}`}
												className='flex flex-wrap justify-between gap-2 py-2 text-sm'
											>
												<div className='min-w-0 flex-1'>
													<p className='wrap-anywhere'>{item.name}</p>
													<p className='text-xs text-muted-foreground'>
														{item.quantity} × {currency(item.unitPriceInCents)}
														{item.discountInCents > 0 &&
															` · Desconto: ${currency(item.discountInCents)}`}
													</p>
												</div>
												<span className='font-medium tabular-nums'>
													{currency(
														item.quantity * item.unitPriceInCents - item.discountInCents,
													)}
												</span>
											</li>
										))}
									</ul>
								)}
							</div>
							<dl className='space-y-2 border-t pt-3 text-sm'>
								<div className='flex flex-wrap justify-between gap-2'>
									<dt>Total da cobrança</dt>
									<dd className='font-medium tabular-nums'>{currency(charge.totalInCents)}</dd>
								</div>
								<div className='flex flex-wrap justify-between gap-2'>
									<dt>Pagamentos anteriores</dt>
									<dd className='font-medium tabular-nums'>{currency(charge.paidInCents)}</dd>
								</div>
								<div className='space-y-1 border-t pt-3'>
									<dt className='text-muted-foreground'>Saldo atual</dt>
									<dd className='text-2xl font-semibold tabular-nums'>
										{currency(charge.balanceInCents)}
									</dd>
								</div>
							</dl>
						</section>
						<section
							aria-label='Pagamento online'
							className='min-w-0 space-y-4 rounded-xl border bg-card p-4 shadow-sm sm:p-6 lg:col-start-1 lg:row-start-1'
						>
							<h2 className='text-lg font-semibold'>Forma de pagamento</h2>
							<p className='text-sm text-muted-foreground'>
								Pagamento via Mercado Pago. Consulte a situação antes de tentar novamente.
							</p>
							{option ? (
								<OnlinePaymentCheckout
									key={charge.id}
									chargeId={charge.id}
									balanceInCents={charge.balanceInCents}
									option={option}
								/>
							) : (
								<p role='status' className='rounded-lg bg-muted/50 p-3 text-sm'>
									{charge.financialStatus === 'paid'
										? 'Cobrança quitada.'
										: 'Pagamento online indisponível para esta cobrança.'}
								</p>
							)}
						</section>
					</div>
				</div>
			</PageContent>
		</PageContainer>
	);
}

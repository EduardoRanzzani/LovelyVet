import Link from 'next/link';
import { getOwnFinancialReport } from '@/lib/finance/financial-report-queries';
import { getOwnStatementItems } from '@/lib/finance/customer-statement-queries';
import { resolveStatementMonth, selectStatementCharges } from '@/lib/finance/customer-statement';
import { requirePageAccess } from '@/lib/security/authorization';
import {
	PageContainer,
	PageContent,
	PageDescription,
	PageHeader,
	PageHeaderContent,
	PageTitle,
} from '@/components/shared/page-container';
import { getOwnOnlinePaymentOptions } from '@/lib/finance/online-payment-options';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FinanceMonthFilter } from '../finance/_components/finance-month-filter';
import { FinanceSummaryCards } from '../finance/_components/finance-summary-cards';
import { CustomerChargeCard } from '../finance/_components/customer-charge-card';

export default async function MyFinancePage({
	searchParams,
}: {
	searchParams: Promise<{ month?: string | string[]; scope?: string | string[] }>;
}) {
	const context = await requirePageAccess('/my-finance');
	// Um usuário sem cadastro de tutor não deve consultar o financeiro de ninguém.
	if (!context.customerId) {
		return (
			<PageContainer>
				<PageHeader>
					<PageHeaderContent>
						<PageTitle>Meu financeiro</PageTitle>
					</PageHeaderContent>
				</PageHeader>
				<PageContent>
					<PageDescription>
						Seu perfil de tutor ainda não está vinculado a um cadastro. Entre em contato com a clínica.
					</PageDescription>
				</PageContent>
			</PageContainer>
		);
	}
	const { month, scope } = await searchParams;
	const selected = resolveStatementMonth(month);
	const selectedScope = scope === 'all' ? 'all' : 'month';
	const report = await getOwnFinancialReport(selected);
	const statement = selectStatementCharges(report.statements, selected, selectedScope);
	const items = await getOwnStatementItems(statement.map((charge) => charge.id));
	const paymentOptions = await getOwnOnlinePaymentOptions(context, statement);
	const href = `/my-finance?month=${selected}`;
	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Meu financeiro</PageTitle>
				</PageHeaderContent>
			</PageHeader>
			<PageContent>
				<PageDescription>
					Acompanhe as cobranças, valores em aberto e pagamentos dos pets vinculados ao seu cadastro. Outros
					tutores do mesmo pet também podem consultar essas informações.
				</PageDescription>
				<FinanceMonthFilter selected={selected} />
				<FinanceSummaryCards
					billedInCents={report.billedInCents}
					receivedInCents={report.receivedInCents}
					outstandingInCents={report.outstandingInCents}
					invoicedCount={report.invoicedCount}
				/>
				<p className='text-xs text-muted-foreground'>
					Os valores faturados e recebidos consideram o mês selecionado. O saldo em aberto considera todo o
					histórico dos pets vinculados.
				</p>
				<section className='min-w-0 space-y-3'>
					<h2 className='text-lg font-semibold'>Cobranças e pagamentos dos meus pets</h2>
					<nav aria-label='Período dos lançamentos' className='flex flex-wrap gap-2'>
						<Button asChild variant={selectedScope === 'month' ? 'default' : 'outline'} size='sm'>
							<Link href={href} aria-current={selectedScope === 'month' ? 'page' : undefined}>
								Movimentações do mês
							</Link>
						</Button>
						<Button asChild variant={selectedScope === 'all' ? 'default' : 'outline'} size='sm'>
							<Link
								href={`${href}&scope=all`}
								aria-current={selectedScope === 'all' ? 'page' : undefined}
							>
								Histórico completo
							</Link>
						</Button>
					</nav>
					<p className='text-xs text-muted-foreground'>
						Cada cobrança mostra sua situação atual e todo o histórico de pagamentos. Os preços e descontos
						são os registrados no atendimento; os nomes correspondem ao catálogo atual.
					</p>
					{statement.length === 0 ? (
						<div className='space-y-2 rounded-xl border border-dashed p-4'>
							<p className='text-sm text-muted-foreground'>
								{selectedScope === 'all' || report.statements.length === 0
									? 'Seus pets ainda não possuem cobranças.'
									: 'Nenhuma movimentação no mês selecionado.'}
							</p>
							{selectedScope === 'month' && report.statements.length > 0 && (
								<Link className='text-sm underline underline-offset-4' href={`${href}&scope=all`}>
									Consultar histórico completo
								</Link>
							)}
						</div>
					) : (
						<div className='min-w-0 space-y-3'>
							{statement.map((charge) => (
								<CustomerChargeCard
									key={charge.id}
									charge={charge}
									items={items.get(charge.id) ?? []}
									month={selected}
									paymentAction={
										paymentOptions.has(charge.id) ? (
											<Button asChild className='w-full sm:w-auto'>
												<Link
													href={`/my-finance/${charge.id}/payment?month=${selected}&scope=${selectedScope}`}
												>
													<Wallet />{' '}
													{paymentOptions.get(charge.id)?.attemptId
														? 'Acompanhar pagamento'
														: paymentOptions.get(charge.id)?.canStart
															? 'Pagar online'
															: 'Pagamento online (prévia)'}
												</Link>
											</Button>
										) : undefined
									}
								/>
							))}
						</div>
					)}
				</section>
			</PageContent>
		</PageContainer>
	);
}

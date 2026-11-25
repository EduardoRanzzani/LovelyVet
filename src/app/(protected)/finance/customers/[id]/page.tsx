import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { getFinancialCustomerNames, getFinancialReport } from '@/lib/finance/financial-report-queries';
import { getCustomerStatementItems } from '@/lib/finance/customer-statement-queries';
import { resolveStatementMonth, selectStatementCharges } from '@/lib/finance/customer-statement';
import { requirePageAccess } from '@/lib/security/authorization';
import { PageContainer, PageContent, PageDescription, PageHeader, PageHeaderContent, PageTitle } from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import { FinanceMonthFilter } from '../../_components/finance-month-filter';
import { FinanceSummaryCards } from '../../_components/finance-summary-cards';
import { CustomerChargeCard } from '../../_components/customer-charge-card';

export default async function TutorStatement({ params, searchParams }: {
 params: Promise<{ id: string }>;
 searchParams: Promise<{ month?: string | string[]; scope?: string | string[] }>;
}) {
 await requirePageAccess('/finance');
 const { id } = await params;
 if (!z.uuid().safeParse(id).success) notFound();
 const { month, scope } = await searchParams;
 const selected = resolveStatementMonth(month);
 const selectedScope = scope === 'all' ? 'all' : 'month';
 const report = await getFinancialReport(selected, id);
 // Autoriza pelo histórico completo, não apenas pelos lançamentos do mês.
 if (!report.statements.length) notFound();
 const statement = selectStatementCharges(report.statements, selected, selectedScope);
 const [names, items] = await Promise.all([
  getFinancialCustomerNames([id]),
  getCustomerStatementItems(id, statement.map(charge => charge.id)),
 ]);
 const href = `/finance/customers/${id}?month=${selected}`;
 return (
  <PageContainer>
   <PageHeader><PageHeaderContent><PageTitle>Extrato financeiro</PageTitle></PageHeaderContent></PageHeader>
   <PageContent>
    <div className='min-w-0 space-y-3'>
     <Button asChild variant='outline' size='sm'>
      <Link href={`/finance?month=${selected}`}><ArrowLeft aria-hidden='true' /> Voltar ao financeiro</Link>
     </Button>
     <h2 className='text-xl font-semibold wrap-anywhere'>{names[id] ?? 'Tutor não identificado'}</h2>
     <PageDescription>Consulte as cobranças e os pagamentos deste tutor.</PageDescription>
    </div>
    <FinanceMonthFilter selected={selected} />
    <FinanceSummaryCards billedInCents={report.billedInCents} receivedInCents={report.receivedInCents} outstandingInCents={report.outstandingInCents} invoicedCount={report.invoicedCount} />
    <p className='text-xs text-muted-foreground'>Os valores faturados e recebidos consideram o mês selecionado. O saldo em aberto e a situação de cada cobrança são atuais, considerando todo o histórico.</p>
    <section className='min-w-0 space-y-3'>
     <h2 className='text-lg font-semibold'>Cobranças e pagamentos</h2>
     <nav aria-label='Período dos lançamentos' className='flex flex-wrap gap-2'>
      <Button asChild variant={selectedScope === 'month' ? 'default' : 'outline'} size='sm'>
       <Link href={href} aria-current={selectedScope === 'month' ? 'page' : undefined}>Movimentações do mês</Link>
      </Button>
      <Button asChild variant={selectedScope === 'all' ? 'default' : 'outline'} size='sm'>
       <Link href={`${href}&scope=all`} aria-current={selectedScope === 'all' ? 'page' : undefined}>Histórico completo</Link>
      </Button>
     </nav>
     <p className='text-xs text-muted-foreground'>{selectedScope === 'month' ? 'Inclui cobranças emitidas no mês e cobranças de outros meses com pagamentos no período.' : 'Exibe todas as cobranças acessíveis do tutor, independentemente do mês.'} Cada cobrança exibe seu histórico completo de pagamentos.</p>
     <p className='text-xs text-muted-foreground'>Os preços e descontos dos itens são os registrados no atendimento; os nomes correspondem ao catálogo atual.</p>
     {statement.length === 0 ? (
      <div className='space-y-2 rounded-xl border border-dashed p-4'>
       <p className='text-sm text-muted-foreground'>Nenhuma movimentação no mês selecionado.</p>
       <Link className='text-sm underline underline-offset-4' href={`${href}&scope=all`}>Consultar histórico completo</Link>
      </div>
     ) : (
      <div className='min-w-0 space-y-3'>
       {statement.map(charge => <CustomerChargeCard key={charge.id} charge={charge} items={items.get(charge.id) ?? []} month={selected} />)}
      </div>
     )}
    </section>
   </PageContent>
  </PageContainer>
 );
}

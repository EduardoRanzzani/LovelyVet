import { ChevronRight } from 'lucide-react';
import { ChargeStatusBadge } from '@/components/shared/charge-status-badge';
import { FinanceSummaryCards } from './_components/finance-summary-cards';
import { FinanceMonthFilter } from './_components/finance-month-filter';
import Link from 'next/link';
import { getFinancialReport, getFinancialCustomerNames } from '@/lib/finance/financial-report-queries';
import { requirePageAccess } from '@/lib/security/authorization';
import { formatCurrencyFromCents } from '@/helpers/currency';
import { PageContainer, PageContent, PageDescription, PageHeader, PageHeaderContent, PageTitle } from '@/components/shared/page-container';

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
const dateFormatter = new Intl.DateTimeFormat('pt-BR', {timeZone:'America/Campo_Grande', day:'2-digit', month:'2-digit', year:'numeric'});
export default async function FinancePage({searchParams}: {searchParams: Promise<{month?: string}>}) {
 await requirePageAccess('/finance');
 const {month} = await searchParams;
 const parts = new Intl.DateTimeFormat('en-US',{timeZone:'America/Campo_Grande', year:'numeric',month:'2-digit'}).formatToParts(new Date());
 const current = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}`;
 const selected = month && monthPattern.test(month) ? month : current;
 const report = await getFinancialReport(selected);
 const customerIds = [...new Set(report.statements.map(item => item.customerId))];
 const names = await getFinancialCustomerNames(customerIds);
 const byCustomer = new Map<string,{total:number, count:number}>();
 for(const item of report.statements) {
  if(item.balanceInCents <= 0) continue;
  const prev=byCustomer.get(item.customerId) ?? {total:0,count:0};
  byCustomer.set(item.customerId, {total:prev.total+item.balanceInCents,count:prev.count+1});
 }
 return <PageContainer>
  <PageHeader><PageHeaderContent><PageTitle>Financeiro</PageTitle></PageHeaderContent></PageHeader>
  <PageContent>
   <PageDescription>Faturamento, recebimentos e saldos dos atendimentos. Não inclui plantões.</PageDescription>
   <FinanceMonthFilter selected={selected} />
   <FinanceSummaryCards
    billedInCents={report.billedInCents}
    receivedInCents={report.receivedInCents}
    outstandingInCents={report.outstandingInCents}
    invoicedCount={report.invoicedCount}
   />
   <p className='text-xs text-muted-foreground'>Faturado e cobranças válidas: cobranças emitidas no mês selecionado, exceto canceladas. Recebido: pagamentos registrados nesse mês, mesmo de cobranças anteriores. Em aberto: saldo atual de todas as cobranças não canceladas. Valores em reais.</p>
   <section className='space-y-3'>
    <h2 className='text-lg font-semibold'>Tutores com saldo pendente</h2>
    {byCustomer.size === 0 ? <p className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>Nenhum saldo pendente nos atendimentos acessíveis.</p> :
     <div className='space-y-2'>{[...byCustomer.entries()].sort((a,b)=>b[1].total-a[1].total).map(([id,value]) =>
      <Link key={id} href={`/finance/customers/${id}?month=${selected}`} className='group flex min-w-0 items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring sm:p-4'>
       <div className='flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-1'>
        <div className='min-w-0'>
         <p className='font-medium wrap-anywhere'>{names[id] ?? 'Tutor'}</p>
         <p className='text-xs text-muted-foreground'>{value.count} {value.count === 1 ? 'cobrança pendente' : 'cobranças pendentes'}</p>
        </div>
        <p className='min-w-0 font-semibold tabular-nums wrap-anywhere text-amber-700 dark:text-amber-300'>{formatCurrencyFromCents(value.total)}</p>
       </div>
       <ChevronRight aria-hidden='true' className='size-4 shrink-0 text-muted-foreground' />
      </Link>)}</div>}
   </section>
   <section className='space-y-3'>
    <h2 className='text-lg font-semibold'>Cobranças do mês</h2>
    {report.monthlyStatements.length === 0 ? <p className='text-sm text-muted-foreground'>Nenhuma cobrança registrada no mês selecionado.</p> :
     <div className='space-y-2'>{report.monthlyStatements.slice().sort((a,b)=>b.createdAt.getTime()-a.createdAt.getTime()).slice(0,30).map(item =>
      <Link href={`/finance/customers/${item.customerId}?month=${selected}`} key={item.id} className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 hover:bg-muted/50'>
       <div><p className='font-medium'>{names[item.customerId] ?? 'Tutor'} · {item.petName}</p><div className='mt-1 flex flex-wrap items-center gap-2'><p className='text-xs text-muted-foreground'>{dateFormatter.format(item.createdAt)}</p><ChargeStatusBadge status={item.financialStatus} /></div></div>
       <div className='text-right text-sm tabular-nums'><p>{formatCurrencyFromCents(item.totalInCents)}</p><p className='text-muted-foreground'>Saldo: {formatCurrencyFromCents(item.balanceInCents)}</p></div>
      </Link>)}</div>}
   </section>
  </PageContent>
 </PageContainer>;
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { getFinancialCustomerNames, getFinancialReport } from '@/lib/finance/financial-report-queries';
import { requirePageAccess } from '@/lib/security/authorization';
import { formatCurrencyFromCents } from '@/helpers/currency';
import { PageContainer, PageContent, PageDescription, PageHeader, PageHeaderContent, PageTitle } from '@/components/shared/page-container';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {timeZone:'America/Campo_Grande',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
const paymentMethod: Record<string,string> = {pix:'Pix',cash:'Dinheiro',credit_card:'Crédito',debit_card:'Débito',transfer:'Transferência'};
export default async function TutorStatement({params, searchParams}: {params:Promise<{id:string}>, searchParams:Promise<{month?: string}>}) {
 await requirePageAccess('/finance');
 const {id} = await params;
 if(!z.uuid().safeParse(id).success) notFound();
 const {month} = await searchParams;
 const parts = new Intl.DateTimeFormat('en-US',{timeZone:'America/Campo_Grande', year:'numeric',month:'2-digit'}).formatToParts(new Date());
 const current = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}`;
 const selected = month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : current;
 const report = await getFinancialReport(selected,id);
 // Somente tutores presentes em cobranças autorizadas podem ter os dados exibidos.
 if(!report.statements.length) notFound();
 const names = await getFinancialCustomerNames([id]);
 const statement = report.statements.slice().sort((a,b)=>b.createdAt.getTime()-a.createdAt.getTime());
 return <PageContainer>
  <PageHeader><PageHeaderContent><PageTitle>Extrato financeiro</PageTitle></PageHeaderContent></PageHeader>
  <PageContent>
   <Link className='text-sm underline' href={`/finance?month=${selected}`}>Voltar ao financeiro</Link>
   <PageDescription>Tutor: {names[id] ?? 'Não identificado'}. Histórico de cobranças acessíveis e seus pagamentos.</PageDescription>
   <div className='grid gap-3 sm:grid-cols-3'>
    {([['Cobrado no mês',report.billedInCents],['Recebido no mês',report.receivedInCents],['Saldo total em aberto',report.outstandingInCents]] as const).map(([label,total])=>
     <div className='rounded-lg border p-4' key={label}><p className='text-sm text-muted-foreground'>{label}</p><p className='mt-1 text-xl font-bold tabular-nums'>{formatCurrencyFromCents(total)}</p></div>)}
   </div>
   <p className='text-xs text-muted-foreground'>Os indicadores de faturamento e recebimento usam o mês selecionado; os lançamentos abaixo mostram o histórico completo deste tutor.</p>
   <div className='space-y-3'>{statement.map(charge =>
    <section key={charge.id} className='rounded-lg border p-4'>
     <div className='flex flex-wrap justify-between gap-2'><div><p className='font-semibold'>{charge.petName}</p><p className='text-xs text-muted-foreground'>Cobrança {dateFormatter.format(charge.createdAt)} · {charge.financialStatus}</p></div><div className='text-right text-sm tabular-nums'><p>Total: {formatCurrencyFromCents(charge.totalInCents)}</p><p>Saldo: {formatCurrencyFromCents(charge.balanceInCents)}</p></div></div>
     {charge.payments.length > 0 && <div className='mt-3 space-y-1 border-t pt-3'>{charge.payments.map(payment=>
      <div key={payment.id} className='flex flex-wrap justify-between gap-2 text-sm'><span>{dateFormatter.format(payment.receivedAt)} · {paymentMethod[payment.method] ?? payment.method}</span><span className='tabular-nums'>{formatCurrencyFromCents(payment.amountInCents)}</span></div>
     )}</div>}
    </section>
   )}</div>
  </PageContent>
 </PageContainer>;
}

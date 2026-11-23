'use client';

import { cancelAppointmentCharge, createAppointmentCharge, recordChargePayment } from '@/api/actions/billing.actions';
import type { BillingOverview } from '@/lib/finance/billing-queries';
import type { AppointmentListItem } from '@/api/schema/appointments.schema';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrencyFromCents } from '@/helpers/currency';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

const methodLabels = { pix: 'Pix', cash: 'Dinheiro', credit_card: 'Cartão de crédito', debit_card: 'Cartão de débito', transfer: 'Transferência' } as const;
type Method = keyof typeof methodLabels;

export default function AppointmentBillingEditor({ appointment, billing, onSuccess }: {
 appointment: AppointmentListItem;
 billing?: BillingOverview;
 onSuccess?: () => void;
}) {
 const router = useRouter();
 const tutors = appointment.pet.petTutors.filter((row) => Boolean(row.tutor.id));
 const [customerId, setCustomerId] = useState(tutors[0]?.tutor.id ?? '');
 const [amount, setAmount] = useState('');
 const [method, setMethod] = useState<Method>('pix');
 const operationKeyRef = useRef<string | null>(null);
 const refresh = () => { router.refresh(); onSuccess?.(); };
 const create = useAction(createAppointmentCharge, {
  onSuccess: () => { toast.success('Cobrança criada'); refresh(); },
  onError: ({error}) => toast.error(error.serverError ?? 'Não foi possível criar a cobrança.'),
 });
 const payment = useAction(recordChargePayment, {
  onSuccess: () => { toast.success('Pagamento registrado'); refresh(); },
  onError: ({error}) => toast.error(error.serverError ?? 'Não foi possível registrar o pagamento.'),
 });
 const cancel = useAction(cancelAppointmentCharge, {
  onSuccess: () => { toast.success('Cobrança cancelada'); refresh(); },
  onError: ({error}) => toast.error(error.serverError ?? 'Não foi possível cancelar a cobrança.'),
 });
 const isPending = create.isPending || payment.isPending || cancel.isPending;
 const precise = /^\d+(?:\.\d{1,2})?$/.test(amount.trim());
 const cents = precise ? Math.round(Number(amount) * 100) : 0;
 const validAmount = amount.trim() !== '' && Number.isSafeInteger(cents) && cents > 0 && cents <= (billing?.balanceInCents ?? 0);
 const recordPayment = () => {
  if (!validAmount) return;
  const key = operationKeyRef.current ?? crypto.randomUUID();
  operationKeyRef.current = key;
  payment.execute({ appointmentId: appointment.id, operationKey: key, amountInCents: cents, method });
 };
 return <DialogContent className='max-h-[92dvh] overflow-y-auto sm:max-w-lg'>
  <DialogHeader>
   <DialogTitle>Financeiro do atendimento</DialogTitle>
   <DialogDescription>{appointment.pet.name} — {formatCurrencyFromCents(appointment.totalPriceInCents)}. Valores em centavos e histórico de pagamentos.</DialogDescription>
  </DialogHeader>
  {!billing ? <div className='space-y-3'>
   <p className='text-sm text-muted-foreground'>Ainda não há cobrança. Selecione o tutor que ficará responsável pelo pagamento.</p>
   <label className='block space-y-1 text-sm'>Tutor responsável
    <select aria-label='Tutor responsável' className='w-full rounded-md border bg-background p-2' value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
     <option value=''>Selecione</option>
     {tutors.map(({tutor}) => <option key={tutor.id} value={tutor.id}>{tutor.user.name}</option>)}
    </select>
   </label>
   <p className='text-xs text-muted-foreground'>A cobrança será criada somente para este atendimento concluído. A emissão não registra pagamento.</p>
   <Button type='button' disabled={isPending || !customerId || appointment.status !== 'completed' || appointment.isPaid || appointment.totalPriceInCents <= 0} onClick={() => create.execute({appointmentId: appointment.id, customerId})}>Emitir cobrança</Button>
  </div> : <div className='space-y-3'>
   <div className='rounded-md border p-3 text-sm space-y-1'>
    <div className='flex justify-between'><span>Valor original</span><strong>{formatCurrencyFromCents(billing.totalInCents)}</strong></div>
    <div className='flex justify-between'><span>Recebido</span><strong>{formatCurrencyFromCents(billing.paidInCents)}</strong></div>
    <div className='flex justify-between'><span>Saldo</span><strong>{formatCurrencyFromCents(billing.balanceInCents)}</strong></div>
    <p className='text-xs text-muted-foreground'>Situação: {({pending: 'Pendente',partial:'Parcial',paid:'Pago',void:'Cancelada'} as const)[billing.status]}</p>
   </div>
   <div className='space-y-1 text-sm'>
    <strong>Histórico de recebimentos</strong>
    {billing.payments.length === 0 ? <p className='text-muted-foreground'>Nenhum pagamento registrado.</p> : billing.payments.map((p) => <p key={p.id}>{new Date(p.receivedAt).toLocaleDateString('pt-BR')} · {methodLabels[p.method as Method] ?? p.method} · {formatCurrencyFromCents(p.amountInCents)}</p>)}
   </div>
   {billing.status !== 'void' && billing.balanceInCents > 0 && <div className='space-y-2 border-t pt-3'>
    <label className='block text-sm'>Valor recebido (R$)<input aria-label='Valor recebido' className='mt-1 w-full rounded-md border bg-background p-2' type='number' min='0.01' step='0.01' max={(billing.balanceInCents / 100).toFixed(2)} value={amount} onChange={(event) => {setAmount(event.target.value); operationKeyRef.current = null;}} /></label>
    <label className='block text-sm'>Forma de pagamento<select aria-label='Forma de pagamento' className='mt-1 w-full rounded-md border bg-background p-2' value={method} onChange={(event) => {setMethod(event.target.value as Method); operationKeyRef.current = null;}}>{Object.entries(methodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <Button type='button' disabled={isPending || !validAmount} onClick={recordPayment}>Registrar recebimento</Button>
   </div>}
   {billing.status === 'pending' && <Button variant='destructive' type='button' disabled={isPending} onClick={() => {if (window.confirm('Cancelar esta cobrança sem pagamentos?')) cancel.execute({appointmentId: appointment.id});}}>Cancelar cobrança</Button>}
  </div>}
  <DialogFooter><DialogClose asChild><Button type='button' variant='outline'>Fechar</Button></DialogClose></DialogFooter>
 </DialogContent>;
}

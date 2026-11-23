'use client';

import {
	cancelAppointmentCharge,
	createAppointmentCharge,
	recordChargePayment,
} from '@/api/actions/billing.actions';
import type { AppointmentListItem } from '@/api/schema/appointments.schema';
import MoneyInputForm from '@/components/form/money-input-form';
import SelectForm from '@/components/form/select-form';
import { Button } from '@/components/ui/button';
import {
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrencyFromCents } from '@/helpers/currency';
import type { BillingOverview } from '@/lib/finance/billing-queries';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

const methodLabels = {
	pix: 'Pix',
	cash: 'Dinheiro',
	credit_card: 'Cartão de crédito',
	debit_card: 'Cartão de débito',
	transfer: 'Transferência',
} as const;
type Method = keyof typeof methodLabels;
type BillingForm = {
	customerId: string;
	amount: number | undefined;
	method: Method;
};

export default function AppointmentBillingEditor({
	appointment,
	billing,
	onSuccess,
}: {
	appointment: AppointmentListItem;
	billing?: BillingOverview;
	onSuccess?: () => void;
}) {
	const router = useRouter();
	const tutors = appointment.pet.petTutors.filter(({ tutor }) =>
		Boolean(tutor.id),
	);
	const form = useForm<BillingForm>({
		defaultValues: {
			customerId: tutors[0]?.tutor.id ?? '',
			amount: undefined,
			method: 'pix',
		},
	});
	const customerId = useWatch({ control: form.control, name: 'customerId' });
	const amount = useWatch({ control: form.control, name: 'amount' });
	const method = useWatch({ control: form.control, name: 'method' });
	// A chave só é lida em um evento. Reuso da chave apenas para reenvios do mesmo pagamento.
	const operationRef = useRef<{ signature: string; key: string } | null>(null);
	const refresh = () => {
		router.refresh();
		onSuccess?.();
	};
	const create = useAction(createAppointmentCharge, {
		onSuccess: () => {
			toast.success('Cobrança emitida');
			refresh();
		},
		onError: ({ error }) =>
			toast.error(error.serverError ?? 'Não foi possível emitir a cobrança.'),
	});
	const payment = useAction(recordChargePayment, {
		onSuccess: () => {
			operationRef.current = null;
			toast.success('Pagamento registrado');
			refresh();
		},
		onError: ({ error }) =>
			toast.error(
				error.serverError ?? 'Não foi possível registrar o pagamento.',
			),
	});
	const cancel = useAction(cancelAppointmentCharge, {
		onSuccess: () => {
			toast.success('Cobrança cancelada');
			refresh();
		},
		onError: ({ error }) =>
			toast.error(error.serverError ?? 'Não foi possível cancelar a cobrança.'),
	});
	const isPending = create.isPending || payment.isPending || cancel.isPending;
	const cents =
		typeof amount === 'number' && Number.isFinite(amount)
			? Math.round(amount * 100)
			: 0;
	const validAmount =
		Number.isSafeInteger(cents) &&
		cents > 0 &&
		cents <= (billing?.balanceInCents ?? 0);
	const cannotBillReason =
		appointment.status !== 'completed'
			? 'Conclua o atendimento antes de emitir a cobrança.'
			: appointment.isPaid
				? 'Este atendimento está marcado como pago no cadastro anterior.'
				: appointment.totalPriceInCents <= 0
					? 'Adicione itens e um valor maior que zero antes de emitir a cobrança.'
					: !customerId
						? 'Selecione o tutor responsável pelo pagamento.'
						: null;

	const recordPayment = () => {
		if (!validAmount || payment.isPending) return;
		const signature = `${appointment.id}:${cents}:${method}`;
		const key =
			operationRef.current?.signature === signature
				? operationRef.current.key
				: crypto.randomUUID();
		operationRef.current = { signature, key };
		payment.execute({
			appointmentId: appointment.id,
			operationKey: key,
			amountInCents: cents,
			method,
		});
	};

	return (
		<DialogContent className='max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto'>
			<DialogHeader>
				<DialogTitle>Financeiro do atendimento</DialogTitle>
				<DialogDescription>
					{appointment.pet.name} —{' '}
					{formatCurrencyFromCents(appointment.totalPriceInCents)}. Cobranças e
					pagamentos são lançamentos manuais.
				</DialogDescription>
			</DialogHeader>
			{!billing ? (
				<div className='space-y-4'>
					<p className='text-sm text-muted-foreground'>
						Selecione o tutor responsável. Emitir uma cobrança não registra
						pagamento.
					</p>
					<SelectForm<BillingForm>
						label='Tutor responsável'
						name='customerId'
						control={form.control}
						options={tutors.flatMap(({ tutor }) =>
							tutor.id
								? [
										{
											value: tutor.id,
											label: tutor.user.name,
										},
									]
								: [],
						)}
						placeholder='Selecione o tutor'
					/>
					{cannotBillReason && (
						<p
							role='status'
							className='text-sm text-amber-700 dark:text-amber-300'
						>
							{cannotBillReason}
						</p>
					)}
					<Button
						type='button'
						disabled={isPending || Boolean(cannotBillReason)}
						onClick={() =>
							create.execute({ appointmentId: appointment.id, customerId })
						}
					>
						{create.isPending ? 'Emitindo...' : 'Emitir cobrança'}
					</Button>
				</div>
			) : (
				<div className='space-y-4'>
					<div className='space-y-1 rounded-md border p-3 text-sm'>
						<div className='flex justify-between gap-2'>
							<span>Valor original</span>
							<strong>{formatCurrencyFromCents(billing.totalInCents)}</strong>
						</div>
						<div className='flex justify-between gap-2'>
							<span>Recebido</span>
							<strong>{formatCurrencyFromCents(billing.paidInCents)}</strong>
						</div>
						<div className='flex justify-between gap-2'>
							<span>Saldo</span>
							<strong>{formatCurrencyFromCents(billing.balanceInCents)}</strong>
						</div>
						<p className='text-xs text-muted-foreground'>
							Situação:{' '}
							{
								(
									{
										pending: 'Pendente',
										partial: 'Parcial',
										paid: 'Pago',
										void: 'Cancelada',
									} as const
								)[billing.status]
							}
						</p>
					</div>
					<section className='space-y-2 text-sm'>
						<strong>Histórico de recebimentos</strong>
						{billing.payments.length === 0 ? (
							<p className='text-muted-foreground'>
								Nenhum pagamento registrado.
							</p>
						) : (
							billing.payments.map((p) => (
								<p key={p.id} className='wrap-break-word'>
									{new Date(p.receivedAt).toLocaleDateString('pt-BR')} ·{' '}
									{methodLabels[p.method as Method] ?? p.method} ·{' '}
									{formatCurrencyFromCents(p.amountInCents)}
								</p>
							))
						)}
					</section>
					{billing.status !== 'void' && billing.balanceInCents > 0 && (
						<div className='space-y-3 border-t pt-3'>
							<MoneyInputForm<BillingForm>
								label='Valor recebido (R$)'
								name='amount'
								control={form.control}
								placeholder='R$ 0,00'
							/>
							<SelectForm<BillingForm>
								label='Forma de pagamento'
								name='method'
								control={form.control}
								options={Object.entries(methodLabels).map(([value, label]) => ({
									value,
									label,
								}))}
							/>
							{typeof amount === 'number' && !validAmount && (
								<p className='text-xs text-destructive'>
									Informe um valor positivo que não ultrapasse o saldo.
								</p>
							)}
							<Button
								type='button'
								disabled={isPending || !validAmount}
								onClick={recordPayment}
							>
								{payment.isPending ? 'Registrando...' : 'Registrar recebimento'}
							</Button>
						</div>
					)}
					{billing.status === 'pending' && (
						<Button
							variant='destructive'
							type='button'
							disabled={isPending}
							onClick={() => {
								if (
									window.confirm(
										'Cancelar esta cobrança sem pagamentos? O registro ficará no histórico.',
									)
								)
									cancel.execute({ appointmentId: appointment.id });
							}}
						>
							Cancelar cobrança
						</Button>
					)}
					{billing.status === 'void' && (
						<p className='text-xs text-muted-foreground'>
							Cobrança cancelada: mantida no histórico para auditoria. A
							exclusão física do atendimento continua bloqueada.
						</p>
					)}
				</div>
			)}
			<DialogFooter>
				<DialogClose asChild>
					<Button type='button' variant='outline'>
						Fechar
					</Button>
				</DialogClose>
			</DialogFooter>
		</DialogContent>
	);
}

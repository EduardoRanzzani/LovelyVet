'use client';

import {
	deleteFinalizedCareReminder,
	rescheduleCareReminder,
	updateCareReminderStatus,
} from '@/api/actions/care-reminders.actions';
import type { CalendarCareReminderEntry } from '@/api/schema/calendar.schema';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import DatePickerForm from '@/components/form/datepicker-form';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LoadingDialog from '@/components/ui/loading';
import { getCareReminderStatusUI } from '@/lib/agenda/care-reminder-status';
import { format, parseISO } from 'date-fns';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getVaccineReminderUrl } from '@/lib/vaccines/vaccine-reminder-url';
import { BanIcon, CheckCircle2Icon, CheckIcon, SyringeIcon, Trash2Icon, CalendarClockIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

interface CareReminderDialogProps {
	reminder: CalendarCareReminderEntry;
	onSuccess?: () => void;
}

const CareReminderDialog = ({ reminder, onSuccess }: CareReminderDialogProps) => {
	const router = useRouter();
	const [isEditingDate, setIsEditingDate] = useState(false);
	const dateForm = useForm<{ dueDate: Date }>({
		defaultValues: { dueDate: parseISO(reminder.dueDate) },
	});
	const rescheduleAction = useAction(rescheduleCareReminder, {
		onSuccess: () => {
			toast.success('Lembrete reagendado com sucesso.');
			setIsEditingDate(false);
			onSuccess?.();
		},
		onError: ({ error }) => {
			toast.error(error.serverError ?? 'Não foi possível reagendar o lembrete.');
		},
	});
	const saveNewDate = dateForm.handleSubmit(({ dueDate }) => {
		if (!dueDate || Number.isNaN(dueDate.getTime())) {
			toast.error('Selecione uma data válida.');
			return;
		}
		rescheduleAction.execute({ id: reminder.id, dueDate: format(dueDate, 'yyyy-MM-dd') });
	});

	const reminderUI = getCareReminderStatusUI(reminder.status);

	const isPending = reminder.status === 'pending';

	const isVaccine = reminder.title.startsWith('Vacina:');

	const procedureName = isVaccine ? 'Vacinação' : 'Cuidado agendado';

	const procedureDetail = isVaccine ? reminder.title.replace(/^Vacina:\s*/, '').trim() : reminder.title;

	const isVaccineReminder = isPending && reminder.title.startsWith('Vacina: ');

	const handleCompleteVaccine = () => {
		const vaccineName = reminder.title.replace(/^Vacina:\s*/, '').trim();

		router.push(getVaccineReminderUrl(reminder.pet.id, reminder.id, vaccineName));
	};

	const action = useAction(updateCareReminderStatus, {
		onSuccess: () => {
			toast.success('Lembrete concluído com sucesso.');
			onSuccess?.();
		},
		onError: ({ error }) => {
			toast.error(error.serverError ?? 'Não foi possível atualizar o lembrete.');
		},
	});

	const deleteAction = useAction(deleteFinalizedCareReminder, {
		onSuccess: () => {
			toast.success('Lembrete excluído com sucesso.');
			onSuccess?.();
		},
		onError: ({ error }) => {
			toast.error(error.serverError ?? 'Não foi possível excluir o lembrete.');
		},
	});

	return (
		<DialogContent className='max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto sm:max-w-lg'>
			<DialogHeader className='space-y-3 text-left'>
				<div className='flex flex-col items-start gap-2 pr-6'>
					<span
						className={cn(
							'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
							reminderUI.badgeClassName,
						)}
					>
						{reminderUI.label}
					</span>

					<DialogTitle className={cn('text-lg leading-snug wrap-break-word', reminderUI.titleClassName)}>
						{reminder.title}
					</DialogTitle>
				</div>

				<DialogDescription>Acompanhamento de cuidados do paciente.</DialogDescription>
			</DialogHeader>

			<div className='space-y-4 py-2 text-sm'>
				<div className='rounded-lg border p-3'>
					<p className='mb-1 text-xs font-medium text-muted-foreground'>Paciente</p>

					<Link
						href={`/pets/${encodeURIComponent(reminder.pet.id)}`}
						className='inline-flex min-h-11 items-center font-semibold text-foreground underline decoration-current underline-offset-4 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
					>
						{reminder.pet.name}
					</Link>
				</div>

				<div className='rounded-lg border p-3'>
					<p className='mb-1 text-xs font-medium text-muted-foreground'>Data agendada</p>

					{isEditingDate ? (
						<div className='space-y-3'>
							<DatePickerForm<{ dueDate: Date }>
								label='Nova data do retorno'
								name='dueDate'
								control={dateForm.control}
								required
								showFuture
								disabled={rescheduleAction.isPending}
							/>
							<div className='flex flex-wrap gap-2'>
								<Button
									type='button'
									size='sm'
									disabled={rescheduleAction.isPending}
									onClick={() => void saveNewDate()}
								>
									{rescheduleAction.isPending ? 'Salvando...' : 'Salvar nova data'}
								</Button>
								<Button
									type='button'
									size='sm'
									variant='outline'
									disabled={rescheduleAction.isPending}
									onClick={() => {
										dateForm.reset({ dueDate: parseISO(reminder.dueDate) });
										setIsEditingDate(false);
									}}
								>
									Voltar
								</Button>
							</div>
						</div>
					) : (
						<div className='flex flex-wrap items-center justify-between gap-2'>
							<p className='font-medium'>{reminder.dueDate.split('-').reverse().join('/')}</p>
							{isPending && (
								<Button
									type='button'
									size='sm'
									variant='outline'
									onClick={() => setIsEditingDate(true)}
								>
									<CalendarClockIcon className='size-4' /> Reagendar
								</Button>
							)}
						</div>
					)}
				</div>

				<div className='rounded-lg border p-3'>
					<p className='mb-2 text-xs font-medium text-muted-foreground'>Procedimento</p>

					<div className='flex flex-col gap-1'>
						<p className='font-semibold text-foreground'>{procedureName}</p>

						<p className='wrap-break-word text-sm text-foreground'>{procedureDetail}</p>
					</div>

					<p className='mt-2 text-xs leading-relaxed text-muted-foreground'>
						{reminder.status === 'completed'
							? 'Lembrete concluído. Consulte o histórico do paciente para conferir o registro clínico da aplicação.'
							: reminder.status === 'cancelled'
								? 'Procedimento cancelado.'
								: 'Procedimento previsto para esta data.'}
					</p>
				</div>

				{reminder.status === 'completed' && (
					<div
						role='status'
						className='rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm'
					>
						<div className='flex items-start gap-2'>
							<CheckCircle2Icon className='mt-0.5 size-4 shrink-0 text-emerald-600' />

							<p>Lembrete concluído. O registro permanece disponível na agenda para consulta.</p>
						</div>
					</div>
				)}

				{reminder.status === 'cancelled' && (
					<div role='status' className='rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground'>
						Este lembrete foi cancelado. O cancelamento não representa uma vacinação realizada.
					</div>
				)}

				{isVaccineReminder && (
					<p className='text-sm leading-relaxed text-muted-foreground'>
						Confirme os dados da aplicação para concluir esta vacinação. Se houver reforço, um novo lembrete
						será agendado automaticamente.
					</p>
				)}
			</div>

			{(action.isPending || deleteAction.isPending || rescheduleAction.isPending) && <LoadingDialog />}

			{isPending && !isEditingDate && (
				<DialogFooter className='flex-col gap-2 sm:flex-row'>
					{isVaccineReminder ? (
						<Button
							type='button'
							className='min-h-11 w-full bg-vaccine hover:bg-vaccine/80'
							onClick={handleCompleteVaccine}
						>
							<SyringeIcon className='size-4' />
							Concluir vacinação
						</Button>
					) : (
						<Button
							type='button'
							className='min-h-11 w-full'
							disabled={action.isPending}
							onClick={() =>
								action.execute({
									id: reminder.id,
									status: 'completed',
								})
							}
						>
							<CheckCircle2Icon className='size-4' />
							Concluir
						</Button>
					)}
				</DialogFooter>
			)}

			{!isPending && (
				<DialogFooter className='mt-2'>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								type='button'
								variant='destructive'
								disabled={deleteAction.isPending}
								className='min-h-11 w-full sm:w-auto'
							>
								<Trash2Icon className='size-4' />
								Excluir lembrete
							</Button>
						</AlertDialogTrigger>

						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Excluir este lembrete?</AlertDialogTitle>

								<AlertDialogDescription>
									O lembrete será removido definitivamente da agenda. Esta ação não poderá ser
									desfeita. O histórico clínico e as vacinas registradas do paciente serão
									preservados.
								</AlertDialogDescription>
							</AlertDialogHeader>

							<AlertDialogFooter className='grid grid-cols-2 gap-3 sm:space-x-0'>
								<AlertDialogCancel
									className={cn(
										buttonVariants({
											variant: 'destructive',
											size: 'default',
										}),
										'mt-0 w-full hover:bg-destructive/90 hover:text-white',
									)}
								>
									<BanIcon className='mr-2 size-4' />
									Cancelar
								</AlertDialogCancel>

								<AlertDialogAction
									disabled={deleteAction.isPending}
									onClick={() =>
										deleteAction.execute({
											id: reminder.id,
										})
									}
									className='w-full'
								>
									<CheckIcon className='mr-2 size-4' />
									Confirmar
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</DialogFooter>
			)}
		</DialogContent>
	);
};

export default CareReminderDialog;

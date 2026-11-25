'use client';

import { getRescheduleAvailability, rescheduleAppointment } from '@/api/actions/appointments.actions';
import {
	rescheduleAppointmentSchema,
	type AppointmentListItem,
	type RescheduleAppointmentSchema,
} from '@/api/schema/appointments.schema';
import DateTimePickerForm from '@/components/form/datetimepicker-form';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { formatCurrencyFromCents } from '@/helpers/currency';
import { normalizeAppointmentStart } from '@/lib/scheduling/appointment-time';
import { zodResolver } from '@hookform/resolvers/zod';
import { endOfDay, format, startOfDay } from 'date-fns';
import { CalendarClock, Loader2 } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

export default function AppointmentRescheduleDialog({
	appointment,
	onClose,
	onSavingChange,
}: {
	appointment: AppointmentListItem;
	onClose: () => void;
	onSavingChange: (saving: boolean) => void;
}) {
	const router = useRouter();
	const submitting = useRef(false);
	const [availability, setAvailability] = useState<{
		day: string;
		times: string[];
		duration: number;
	} | null>(null);
	const form = useForm<RescheduleAppointmentSchema>({
		resolver: zodResolver(rescheduleAppointmentSchema),
		defaultValues: {
			id: appointment.id,
			scheduledAt: new Date(appointment.scheduledAt),
		},
	});
	const selected = useWatch({ control: form.control, name: 'scheduledAt' });
	const availableTimes = availability?.day === format(selected, 'yyyy-MM-dd') ? availability.times : undefined;
	const availabilityAction = useAction(getRescheduleAvailability, {
		onSuccess: ({ data }) => {
			if (!data) return;
			setAvailability({
				day: format(new Date(data.dayStart), 'yyyy-MM-dd'),
				times: data.availableStarts.map((value) => format(new Date(value), 'HH:mm')),
				duration: data.durationMinutes,
			});
		},
		onError: ({ error }) => {
			setAvailability(null);
			toast.error(error.serverError ?? 'Não foi possível consultar os horários.');
		},
	});
	const saveAction = useAction(rescheduleAppointment, {
		onSuccess: () => {
			toast.success('Atendimento reagendado com sucesso!');
			onClose();
			router.refresh();
		},
		onError: ({ error }) => {
			toast.error(error.serverError ?? 'Não foi possível reagendar o atendimento.');
		},
		onSettled: () => {
			submitting.current = false;
			onSavingChange(false);
		},
	});
	const requestAvailability = (date: Date) => {
		setAvailability(null);
		form.clearErrors('scheduledAt');
		availabilityAction.execute({
			id: appointment.id,
			dayStart: startOfDay(date),
			dayEnd: endOfDay(date),
		});
	};
	const submit = (data: RescheduleAppointmentSchema) => {
		if (submitting.current || availabilityAction.isPending) return;
		const scheduledAt = normalizeAppointmentStart(data.scheduledAt);
		if (!availableTimes?.includes(format(scheduledAt, 'HH:mm'))) {
			form.setError('scheduledAt', {
				message: 'Selecione um horário disponível.',
			});
			return;
		}
		submitting.current = true;
		onSavingChange(true);
		saveAction.execute({ id: appointment.id, scheduledAt });
	};
	return (
		<DialogContent className='sm:max-w-md' showCloseButton={!saveAction.isPending}>
			<DialogHeader>
				<DialogTitle>Reagendar atendimento</DialogTitle>
				<DialogDescription>
					Altere apenas a data e o horário, mantendo os demais dados do atendimento.
				</DialogDescription>
			</DialogHeader>
			<div className='space-y-1 rounded-lg border bg-muted/30 p-3 text-sm'>
				<p className='font-semibold'>{appointment.pet.name}</p>
				<p className='text-muted-foreground'>{appointment.doctor.user.name}</p>
				<p className='text-xs text-muted-foreground'>Data e horário atuais</p>
				<p className='font-medium'>{format(new Date(appointment.scheduledAt), "dd/MM/yyyy 'às' HH:mm")}</p>
				<p>Valor preservado: {formatCurrencyFromCents(appointment.totalPriceInCents)}</p>
			</div>
			<Form {...form}>
				<form
					onSubmit={(event) => {
						void form.handleSubmit(submit)(event);
					}}
					className='min-w-0 space-y-4'
				>
					<DateTimePickerForm
						label='Nova data e horário:'
						name='scheduledAt'
						control={form.control}
						error={form.formState.errors.scheduledAt?.message}
						disabled={saveAction.isPending}
						availableTimes={availableTimes}
						availabilityRequired
						availabilityLoading={availabilityAction.isPending}
						onOpenWithDate={(date) => {
							if (date) requestAvailability(date);
						}}
						onDateChange={requestAvailability}
					/>
					{availability && (
						<p className='text-xs text-muted-foreground'>Duração reservada: {availability.duration} min.</p>
					)}
					<p className='text-xs text-muted-foreground'>
						Serviços, produtos, descontos, valores e vínculos clínicos permanecem inalterados.
					</p>
					<DialogFooter className='flex-row gap-2'>
						<Button
							type='button'
							variant='outline'
							className='flex-1'
							disabled={saveAction.isPending}
							onClick={onClose}
						>
							Cancelar
						</Button>
						<Button
							type='submit'
							className='flex-1'
							disabled={
								saveAction.isPending ||
								availabilityAction.isPending ||
								!availableTimes?.includes(format(selected, 'HH:mm'))
							}
						>
							{saveAction.isPending ? (
								<Loader2 className='size-4 animate-spin' />
							) : (
								<CalendarClock className='size-4' />
							)}
							Reagendar
						</Button>
					</DialogFooter>
				</form>
			</Form>
		</DialogContent>
	);
}

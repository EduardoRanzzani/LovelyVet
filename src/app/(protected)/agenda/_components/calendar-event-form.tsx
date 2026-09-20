'use client';

import {
	deleteCalendarEvent,
	getCalendarEventAvailability,
	upsertCalendarEvent,
} from '@/api/actions/calendar-events.actions';
import {
	createCalendarEventSchema,
	type CreateCalendarEventSchema,
} from '@/api/schema/calendar-event.schema';
import type { DoctorsWithRelations } from '@/api/schema/doctors.schema';
import DateTimePickerForm from '@/components/form/datetimepicker-form';
import InputForm from '@/components/form/input-form';
import SelectForm from '@/components/form/select-form';
import DeleteAlertButton from '@/components/list/delete-alert-dialog';
import { Button } from '@/components/ui/button';
import {
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import LoadingDialog from '@/components/ui/loading';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	addHours,
	addMinutes,
	differenceInMinutes,
	endOfDay,
	format,
	set,
	startOfDay,
} from 'date-fns';
import { BanIcon, Loader2Icon, SaveIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { REGINA_DOCTOR_ID } from '@/api/config/consts';

export type PersonalCalendarEventDetails = {
	id: string;
	doctorId: string;
	title: string;
	startTime: Date;
	endTime: Date;
	notes: string | null;
};

interface CalendarEventFormProps {
	event?: PersonalCalendarEventDetails;
	doctors: DoctorsWithRelations[];
	selectedDate?: Date | null;
	selectedDoctorId?: string;
	viewerRole: 'admin' | 'doctor';
	viewerDoctorId: string | null;
	onSuccess?: () => void;
}

type AvailabilityState = {
	doctorId: string;
	dayKey: string;
	durationMinutes: number;
	availableTimes: string[];
};

const CalendarEventForm = ({
	event,
	doctors,
	selectedDate,
	selectedDoctorId,
	viewerRole,
	viewerDoctorId,
	onSuccess,
}: CalendarEventFormProps) => {
	const defaultStart = event?.startTime
		? new Date(event.startTime)
		: selectedDate
			? set(selectedDate, {
					hours: 9,
					minutes: 0,
					seconds: 0,
					milliseconds: 0,
				})
			: new Date();

	const defaultEnd = event?.endTime
		? new Date(event.endTime)
		: addHours(defaultStart, 1);

	const defaultDoctorId =
		event?.doctorId ??
		(viewerRole === 'doctor' ? viewerDoctorId : selectedDoctorId) ??
		REGINA_DOCTOR_ID;

	const availableDoctors =
		viewerRole === 'doctor'
			? doctors.filter((doctor) => doctor.id === viewerDoctorId)
			: doctors;

	const form = useForm<CreateCalendarEventSchema>({
		resolver: zodResolver(createCalendarEventSchema),
		defaultValues: {
			id: event?.id,
			doctorId: defaultDoctorId,
			title: event?.title ?? '',
			startTime: defaultStart,
			endTime: defaultEnd,
			notes: event?.notes ?? '',
		},
	});

	const [doctorId, startTime, endTime] = useWatch({
		control: form.control,
		name: ['doctorId', 'startTime', 'endTime'],
	});

	const [availability, setAvailability] = useState<AvailabilityState | null>(
		null,
	);

	const upsertAction = useAction(upsertCalendarEvent, {
		onSuccess: () => {
			toast.success(
				event
					? 'Compromisso atualizado com sucesso!'
					: 'Compromisso adicionado à agenda!',
			);

			onSuccess?.();
		},
		onError: ({ error }) => {
			toast.error(
				error.serverError ?? 'Não foi possível salvar o compromisso.',
			);
		},
	});

	const deleteAction = useAction(deleteCalendarEvent, {
		onSuccess: () => {
			toast.success('Compromisso removido da agenda.');

			onSuccess?.();
		},
		onError: ({ error }) => {
			toast.error(
				error.serverError ?? 'Não foi possível excluir o compromisso.',
			);
		},
	});

	const availabilityAction = useAction(getCalendarEventAvailability, {
		onSuccess: ({ data }) => {
			if (!data) return;

			setAvailability({
				doctorId: data.doctorId,
				dayKey: format(new Date(data.dayStart), 'yyyy-MM-dd'),
				durationMinutes: data.durationMinutes,
				availableTimes: data.availableStarts.map((value) =>
					format(new Date(value), 'HH:mm'),
				),
			});
		},
		onError: ({ error }) => {
			setAvailability(null);

			toast.error(
				error.serverError ?? 'Não foi possível verificar a disponibilidade.',
			);
		},
	});

	const requestAvailability = ({
		selectedDoctor,
		start,
		end,
	}: {
		selectedDoctor: string;
		start: Date;
		end: Date;
	}) => {
		if (!selectedDoctor || !(start instanceof Date) || !(end instanceof Date)) {
			setAvailability(null);
			return;
		}

		const durationMinutes = differenceInMinutes(end, start);

		if (durationMinutes <= 0) {
			setAvailability(null);
			return;
		}

		setAvailability(null);

		availabilityAction.execute({
			doctorId: selectedDoctor,
			dayStart: startOfDay(start),
			dayEnd: endOfDay(start),
			durationMinutes,
			eventId: event?.id,
		});
	};

	const currentDuration =
		startTime instanceof Date && endTime instanceof Date
			? differenceInMinutes(endTime, startTime)
			: 0;

	const currentDayKey =
		startTime instanceof Date ? format(startTime, 'yyyy-MM-dd') : '';

	const currentAvailableTimes =
		availability &&
		availability.doctorId === doctorId &&
		availability.dayKey === currentDayKey &&
		availability.durationMinutes === currentDuration
			? availability.availableTimes
			: undefined;

	const currentStartTime =
		startTime instanceof Date ? format(startTime, 'HH:mm') : '';

	const currentStartIsAvailable =
		currentAvailableTimes === undefined ||
		currentAvailableTimes.includes(currentStartTime);

	const formSubmit = (data: CreateCalendarEventSchema) => {
		if (
			currentAvailableTimes &&
			!currentAvailableTimes.includes(format(data.startTime, 'HH:mm'))
		) {
			form.setError('startTime', {
				type: 'manual',
				message:
					'O horário selecionado não está disponível para este veterinário.',
			});

			return;
		}

		upsertAction.execute({
			...data,
			id: event?.id,
		});
	};

	const isPending = upsertAction.isPending || deleteAction.isPending;

	return (
		<DialogContent
			onInteractOutside={(dialogEvent) => dialogEvent.preventDefault()}
			showCloseButton={false}
		>
			<DialogHeader>
				<DialogTitle>
					{event ? 'Editar compromisso' : 'Novo compromisso'}
				</DialogTitle>

				<DialogDescription>
					{event
						? 'Edite as informações do compromisso pessoal.'
						: 'Adicione um compromisso que bloqueará este período para atendimentos.'}
				</DialogDescription>
			</DialogHeader>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(formSubmit)}>
					<div className='flex max-h-100 flex-col gap-3 overflow-y-auto px-1 sm:max-h-none sm:overflow-visible'>
						<SelectForm
							label='Veterinário:'
							name='doctorId'
							control={form.control}
							required
							error={form.formState.errors.doctorId?.message}
							options={availableDoctors.map((doctor) => ({
								value: doctor.id,
								label: doctor.user.name,
							}))}
							onSelect={(value) => {
								const start = form.getValues('startTime');

								const end = form.getValues('endTime');

								requestAvailability({
									selectedDoctor: String(value),
									start,
									end,
								});
							}}
						/>

						<InputForm
							register={form.register}
							label='Compromisso:'
							name='title'
							required
							placeholder='Ex.: Dentista, curso, compromisso pessoal...'
							error={form.formState.errors.title?.message}
						/>

						<div className='flex flex-col gap-3 lg:flex-row'>
							<DateTimePickerForm
								control={form.control}
								label='Início:'
								name='startTime'
								required
								className='flex-1'
								error={form.formState.errors.startTime?.message}
								availableTimes={currentAvailableTimes}
								availabilityLoading={availabilityAction.isPending}
								onOpenWithDate={(date) => {
									if (!date) {
										return;
									}

									requestAvailability({
										selectedDoctor: form.getValues('doctorId'),
										start: date,
										end: form.getValues('endTime'),
									});
								}}
								onValueChange={(newStart) => {
									const duration = currentDuration > 0 ? currentDuration : 60;

									const newEnd = addMinutes(newStart, duration);

									form.setValue('endTime', newEnd, {
										shouldDirty: true,
										shouldValidate: true,
									});

									requestAvailability({
										selectedDoctor: form.getValues('doctorId'),
										start: newStart,
										end: newEnd,
									});
								}}
							/>

							<DateTimePickerForm
								control={form.control}
								label='Término:'
								name='endTime'
								required
								className='flex-1'
								error={form.formState.errors.endTime?.message}
								onValueChange={(newEnd) => {
									requestAvailability({
										selectedDoctor: form.getValues('doctorId'),
										start: form.getValues('startTime'),
										end: newEnd,
									});
								}}
							/>
						</div>

						{availabilityAction.isPending && (
							<p className='text-xs text-muted-foreground'>
								Verificando disponibilidade do período...
							</p>
						)}

						{!availabilityAction.isPending &&
							currentAvailableTimes !== undefined &&
							!currentStartIsAvailable && (
								<p className='text-xs font-medium text-destructive'>
									Este período está ocupado. Escolha outro horário de início.
								</p>
							)}

						<FormField
							control={form.control}
							name='notes'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Observações</FormLabel>

									<FormControl>
										<Textarea
											{...field}
											value={field.value ?? ''}
											rows={4}
											placeholder='Observações opcionais...'
										/>
									</FormControl>

									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{isPending && <LoadingDialog />}

					<DialogFooter className='mt-4 flex gap-2'>
						{event && (
							<DeleteAlertButton
								tooltip='Excluir compromisso'
								disabled={isPending}
								action={() =>
									deleteAction.execute({
										id: event.id,
									})
								}
							/>
						)}

						<DialogClose asChild>
							<Button
								type='button'
								variant='destructive'
								disabled={isPending}
								className='flex-1'
							>
								<BanIcon />
								Cancelar
							</Button>
						</DialogClose>

						<Button
							type='submit'
							disabled={
								isPending ||
								availabilityAction.isPending ||
								!currentStartIsAvailable
							}
							className='flex-1'
						>
							{upsertAction.isPending ? (
								<Loader2Icon className='size-4 animate-spin' />
							) : (
								<>
									<SaveIcon />
									Salvar
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</Form>
		</DialogContent>
	);
};

export default CalendarEventForm;

'use client';

import {
	deleteCalendarEvent,
	upsertCalendarEvent,
} from '@/api/actions/calendar-events.actions';
import type { DoctorsWithRelations } from '@/api/schema/doctors.schema';
import {
	createCalendarEventSchema,
	type CreateCalendarEventSchema,
} from '@/api/schema/calendar-event.schema';
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
import { addHours, set } from 'date-fns';
import { BanIcon, Loader2Icon, SaveIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

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
		(viewerRole === 'doctor'
			? (viewerDoctorId ?? '')
			: (selectedDoctorId ?? ''));

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

	const formSubmit = (data: CreateCalendarEventSchema) => {
		upsertAction.execute({
			...data,
			id: event?.id,
		});
	};

	const isPending = upsertAction.isPending || deleteAction.isPending;

	return (
		<DialogContent
			onInteractOutside={(event) => event.preventDefault()}
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
							/>

							<DateTimePickerForm
								control={form.control}
								label='Término:'
								name='endTime'
								required
								className='flex-1'
								error={form.formState.errors.endTime?.message}
							/>
						</div>

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

						<Button type='submit' disabled={isPending} className='flex-1'>
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

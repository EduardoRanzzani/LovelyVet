'use client';

import {
	getDoctorAvailability,
	upsertAppointment,
} from '@/api/actions/appointments.actions';
import { REGINA_DOCTOR_ID } from '@/api/config/consts';
import {
	AppointmentListItem,
	createAppointmentSchema,
	CreateAppointmentSchema,
} from '@/api/schema/appointments.schema';
import { DoctorOption } from '@/api/schema/doctors.schema';
import { formatPetTutorNames, PetOption } from '@/api/schema/pets.schema';
import { ServicesWithRelations } from '@/api/schema/services.schema';
import DateTimePickerForm from '@/components/form/datetimepicker-form';
import InputForm from '@/components/form/input-form';
import MoneyInputForm from '@/components/form/money-input-form';
import SelectForm from '@/components/form/select-form';
import { fromCents } from '@/lib/money/currency';
import { Button } from '@/components/ui/button';
import {
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import LoadingDialog from '@/components/ui/loading';
import type { UserRole } from '@/lib/security/roles';
import { zodResolver } from '@hookform/resolvers/zod';
import { BanIcon, Loader2Icon, SaveIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { endOfDay, format, startOfDay } from 'date-fns';
import { useState } from 'react';
import { formatCurrencyFromCents } from '@/helpers/currency';

interface AppointmentFormClientProps {
	appointment?: AppointmentListItem;
	pets: PetOption[];
	doctors: DoctorOption[];
	services: ServicesWithRelations[];
	viewerRole: UserRole;
	onSuccess?: () => void;
}

const getServicesKey = (serviceIds: string[]) =>
	[...serviceIds].sort().join(',');

const AppointmentFormClient = ({
	appointment,
	pets,
	doctors,
	services,
	viewerRole,
	onSuccess,
}: AppointmentFormClientProps) => {
	const isCustomer = viewerRole === 'customer';

	const [availability, setAvailability] = useState<{
		doctorId: string;
		servicesKey: string;
		dayKey: string;
		durationMinutes: number;
		availableTimes: string[];
	} | null>(null);

	const form = useForm<CreateAppointmentSchema>({
		resolver: zodResolver(createAppointmentSchema),
		shouldUnregister: true,
		defaultValues: {
			petId: appointment?.petId || '',
			doctorId: appointment?.doctorId || REGINA_DOCTOR_ID,
			scheduledAt: appointment?.scheduledAt
				? new Date(appointment.scheduledAt)
				: new Date(),
			status: appointment?.status || 'pending',
			totalPriceInCents:
				appointment?.totalPriceInCents !== undefined
					? fromCents(appointment.totalPriceInCents)
					: 0,
			notes: appointment?.notes || '',
			// Importante: inicializar o array de serviços se estiver editando
			services: appointment?.items?.map((i) => i.serviceId) || [],
		},
	});

	// 1. Monitorar o pet selecionado
	const [
		selectedPetId,
		selectedServicesIds,
		selectedDoctorId,
		selectedScheduledAt,
	] = useWatch({
		control: form.control,
		name: ['petId', 'services', 'doctorId', 'scheduledAt'],
	});

	// 2. Identificar a espécie
	const selectedPet = pets.find((p) => p.id === selectedPetId);
	const specieIdOfSelectedPet = selectedPet?.breed?.specieId;

	// 3. Filtro de exibição (Mantemos simples)
	const filteredServices = services.filter((service) => {
		// Se não tem pet selecionado, mostra só os gerais
		if (!specieIdOfSelectedPet) return !service.specieId;
		// Se tem pet, mostra os da espécie + gerais
		return service.specieId === specieIdOfSelectedPet || !service.specieId;
	});

	const formSubmit = (data: CreateAppointmentSchema) => {
		if (currentAvailableTimes) {
			const selectedTime = format(data.scheduledAt, 'HH:mm');

			if (!currentAvailableTimes.includes(selectedTime)) {
				form.setError('scheduledAt', {
					type: 'manual',
					message: 'O horário selecionado não está mais disponível.',
				});
				return;
			}
		}

		upsertAppointmentAction.execute({
			...data,
			id: appointment?.id,
			status: appointment?.status ?? 'pending',
		});
	};

	const upsertAppointmentAction = useAction(upsertAppointment, {
		onSuccess: () => {
			onSuccess?.();
			toast.success('Agendamento salvo com sucesso!');
			form.reset();
		},
		onError: ({ error }) => {
			toast.error(
				error.serverError ?? 'Não foi possível salvar o agendamento.',
			);
		},
	});

	const availabilityAction = useAction(getDoctorAvailability, {
		onSuccess: ({ data }) => {
			if (!data) return;
			setAvailability({
				doctorId: data.doctorId,
				servicesKey: data.serviceIds.join(','),
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
		doctorId,
		serviceIds,
		date,
	}: {
		doctorId: string;
		serviceIds: string[];
		date: Date;
	}) => {
		if (!doctorId || serviceIds.length === 0) {
			setAvailability(null);
			return;
		}

		availabilityAction.execute({
			doctorId,
			serviceIds,
			dayStart: startOfDay(date),
			dayEnd: endOfDay(date),
			appointmentId: appointment?.id ?? undefined,
		});
	};

	const selectedServicesKey = getServicesKey(selectedServicesIds ?? []);

	const selectedDayKey = selectedScheduledAt
		? format(selectedScheduledAt, 'yyyy-MM-dd')
		: '';

	const currentAvailableTimes =
		availability &&
		availability.doctorId === selectedDoctorId &&
		availability.servicesKey === selectedServicesKey &&
		availability.dayKey === selectedDayKey
			? availability.availableTimes
			: undefined;

	return (
		<DialogContent
			className='overflow-hidden sm:max-w-2xl'
			onInteractOutside={(e) => e.preventDefault()}
			showCloseButton={false}
		>
			<DialogHeader>
				<DialogTitle>
					{appointment ? 'Atualizar Agendamento' : 'Cadastrar Agendamento'}
				</DialogTitle>
				<DialogDescription>
					Selecione o pet, o veterinário e os serviços prestados.
				</DialogDescription>
			</DialogHeader>

			<Form {...form}>
				<form
					id='appointmentForm'
					className='min-w-0'
					onSubmit={form.handleSubmit(formSubmit)}
				>
					<div className='flex max-h-[calc(100dvh-12rem)] min-w-0 flex-col gap-2 overflow-y-auto px-1'>
						<input
							type='text'
							className='hidden'
							{...form.register('status')}
						/>

						<SelectForm
							label='Pet:'
							name='petId'
							control={form.control}
							error={form.formState.errors.petId?.message}
							options={pets.map((pet) => ({
								value: pet.id,
								label: `${pet.name} ${!isCustomer ? `(${formatPetTutorNames(pet)})` : ''}`,
							}))}
							onSelect={(value) => {
								const petId = String(value);
								const pet = pets.find((item) => item.id === petId);

								if (!pet) return;
								const currentServices = form.getValues('services') ?? [];
								const validServices = currentServices.filter((serviceId) => {
									const service = services.find(
										(item) => item.id === serviceId,
									);

									if (!service) {
										return false;
									}

									return (
										!service.specieId ||
										service.specieId === pet.breed?.specieId
									);
								});

								if (validServices.length !== currentServices.length) {
									form.setValue('services', validServices, {
										shouldDirty: true,
										shouldValidate: true,
									});

									const totalInCents = services
										.filter((service) => validServices.includes(service.id))
										.reduce((sum, service) => sum + service.priceInCents, 0);

									const total = fromCents(totalInCents);

									form.setValue('totalPriceInCents', total, {
										shouldValidate: true,
									});
								}

								requestAvailability({
									doctorId: form.getValues('doctorId'),
									serviceIds: validServices,
									date: form.getValues('scheduledAt'),
								});
							}}
						/>

						<SelectForm
							label='Veterinário:'
							name='doctorId'
							control={form.control}
							error={form.formState.errors.doctorId?.message}
							options={doctors.map((doctor) => ({
								value: doctor.id,
								label: doctor.user.name,
							}))}
							onSelect={(value) => {
								requestAvailability({
									doctorId: String(value),

									serviceIds: form.getValues('services') ?? [],

									date: form.getValues('scheduledAt'),
								});
							}}
						/>

						<SelectForm
							label='Serviços (Selecione um ou mais):'
							name='services'
							multiple
							control={form.control}
							error={form.formState.errors.services?.message}
							options={filteredServices.map((service) => ({
								value: service.id,
								label: `${service.name} - ${formatCurrencyFromCents(
									service.priceInCents,
								)}`,
							}))}
							onSelect={(value) => {
								const serviceIds = Array.isArray(value)
									? value.map(String)
									: [];

								const totalInCents = services
									.filter((service) => serviceIds.includes(service.id))
									.reduce((sum, service) => sum + service.priceInCents, 0);

								const total = fromCents(totalInCents);

								form.setValue('totalPriceInCents', total, {
									shouldValidate: true,
								});

								requestAvailability({
									doctorId: form.getValues('doctorId'),

									serviceIds,

									date: form.getValues('scheduledAt'),
								});
							}}
						/>

						<div className='grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2'>
							<DateTimePickerForm
								label='Data e Hora:'
								control={form.control}
								name='scheduledAt'
								error={form.formState.errors.scheduledAt?.message}
								availableTimes={currentAvailableTimes}
								availabilityLoading={availabilityAction.isPending}
								onOpenWithDate={(date) => {
									if (!date) return;

									requestAvailability({
										doctorId: form.getValues('doctorId'),
										serviceIds: form.getValues('services') ?? [],
										date,
									});
								}}
								onDateChange={(date) => {
									requestAvailability({
										doctorId: form.getValues('doctorId'),
										serviceIds: form.getValues('services') ?? [],
										date,
									});
								}}
							/>

							<MoneyInputForm
								label={`Valor Total: ${!isCustomer ? '(Editável)' : ''}`}
								control={form.control}
								name='totalPriceInCents'
								disabled={isCustomer}
								error={form.formState.errors.totalPriceInCents?.message}
							/>
						</div>

						<InputForm
							label='Observações:'
							register={form.register}
							name='notes'
							error={form.formState.errors.notes?.message}
						/>
					</div>

					{upsertAppointmentAction.isPending && <LoadingDialog />}

					<DialogFooter className='mt-4'>
						<DialogClose asChild>
							<Button type='button' variant='destructive' className='flex-1'>
								<BanIcon className='w-4 h-4 mr-2' /> Cancelar
							</Button>
						</DialogClose>

						<Button
							type='submit'
							disabled={upsertAppointmentAction.isPending}
							className='flex-1'
						>
							{upsertAppointmentAction.isPending ? (
								<Loader2Icon className='w-5 h-5 animate-spin' />
							) : (
								<>
									<SaveIcon className='w-4 h-4 mr-2' /> Salvar
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</Form>
		</DialogContent>
	);
};

export default AppointmentFormClient;

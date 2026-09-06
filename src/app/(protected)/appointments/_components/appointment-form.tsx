'use client';

import { upsertAppointment } from '@/api/actions/appointments.actions';
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
import { useUser } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { BanIcon, Loader2Icon, SaveIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useEffect } from 'react'; // Adicione o useEffect
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface AppointmentFormClientProps {
	appointment?: AppointmentListItem;
	pets: PetOption[];
	doctors: DoctorOption[];
	services: ServicesWithRelations[];
	onSuccess?: () => void;
}

const AppointmentFormClient = ({
	appointment,
	pets,
	doctors,
	services,
	onSuccess,
}: AppointmentFormClientProps) => {
	const { user } = useUser();
	const isCustomer = user?.publicMetadata?.role === 'customer';

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
			totalPriceInCents: appointment?.totalPriceInCents
				? appointment.totalPriceInCents / 100
				: 0,
			notes: appointment?.notes || '',
			// Importante: inicializar o array de serviços se estiver editando
			services: appointment?.items?.map((i) => i.serviceId) || [],
		},
	});

	// 1. Monitorar o pet selecionado
	const selectedPetId = form.watch('petId');
	const selectedServicesIds = form.watch('services');

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

	// 4. EFEITO DE LIMPEZA CORRIGIDO
	useEffect(() => {
		// IMPORTANTE: Se estamos editando, não queremos limpar os campos na primeira renderização
		// A limpeza só deve ocorrer se o PetId mudar e o objeto do Pet já estiver localizado
		if (!selectedPet) return;

		const currentServices = form.getValues('services');
		if (currentServices && currentServices.length > 0) {
			// Validamos contra a lista mestre de services, não contra a variável filtrada de renderização
			const validServices = currentServices.filter((id) => {
				const service = services.find((s) => s.id === id);
				if (!service) return false;
				// É válido se: for geral OU for da espécie do pet selecionado
				return (
					!service.specieId || service.specieId === selectedPet.breed?.specieId
				);
			});

			if (validServices.length !== currentServices.length) {
				form.setValue('services', validServices);
			}
		}
		// Removemos filteredServices das dependências para evitar loops e limpezas precoces
	}, [selectedPetId, selectedPet, services, form]);

	// 5. Cálculo do valor total (Mantido)
	useEffect(() => {
		if (selectedServicesIds && selectedServicesIds.length > 0) {
			const total = services
				.filter((s) => selectedServicesIds.includes(s.id))
				.reduce((acc, curr) => acc + curr.priceInCents / 100, 0);
			form.setValue('totalPriceInCents', total, { shouldValidate: true });
		} else {
			form.setValue('totalPriceInCents', 0);
		}
	}, [selectedServicesIds, services, form]);

	const formSubmit = (data: CreateAppointmentSchema) => {
		upsertAppointmentAction.execute({
			...data,
			id: appointment?.id,
			status: appointment?.status || 'pending',
		});
	};

	const upsertAppointmentAction = useAction(upsertAppointment, {
		onSuccess: () => {
			onSuccess?.();
			toast.success('Agendamento salvo com sucesso!');
			form.reset();
		},
		onError: (err) => {
			console.error('Erro ao salvar agendamento:', err);
			toast.error('Ocorreu um erro ao salvar o agendamento.');
		},
	});

	return (
		<DialogContent
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
				<form id='appointmentForm' onSubmit={form.handleSubmit(formSubmit)}>
					<div className='flex flex-col gap-2 max-h-100 overflow-y-auto px-1 sm:max-h-none sm:overflow-visible'>
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
						/>

						<SelectForm
							label='Serviços (Selecione um ou mais):'
							name='services'
							multiple
							control={form.control}
							error={form.formState.errors.services?.message}
							options={filteredServices.map((service) => ({
								value: service.id,
								label: `${service.name} - R$ ${(service.priceInCents / 100).toFixed(2)}`,
							}))}
						/>

						<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
							<DateTimePickerForm
								label='Data e Hora:'
								control={form.control}
								name='scheduledAt'
								error={form.formState.errors.scheduledAt?.message}
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

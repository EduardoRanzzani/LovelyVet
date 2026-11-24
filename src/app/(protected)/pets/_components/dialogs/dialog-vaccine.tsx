import { insertVaccine } from '@/api/actions/pet-vaccines.actions';
import { REGINA_DOCTOR_ID } from '@/api/config/consts';
import { DoctorsWithRelations } from '@/api/schema/doctors.schema';
import {
	createVaccineSchema,
	CreateVaccineSchema,
} from '@/api/schema/vaccine.schema';
import DatePickerForm from '@/components/form/datepicker-form';
import InputForm from '@/components/form/input-form';
import SelectForm from '@/components/form/select-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { buildVaccineSubmitPayload } from '@/lib/vaccines/vaccine-submit-payload';
import type { FieldErrors } from 'react-hook-form';
import { z } from 'zod';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BanIcon, Loader2Icon, SaveIcon, SyringeIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

interface DialogVaccineProps {
	petId: string;
	doctors: DoctorsWithRelations[];
	vaccineServices: {
		id: string;
		name: string;
		priceInCents: number;
		specieId: string | null;
	}[];
}

const DialogVaccine = ({
	petId,
	doctors,
	vaccineServices,
}: DialogVaccineProps) => {
	const router = useRouter();
	const searchParams = useSearchParams();

	const reminderId = searchParams.get('vaccineReminder');
	const vaccineName = searchParams.get('vaccineName');
	const appointmentId = searchParams.get('appointmentId');
	const vaccineService = searchParams.get('vaccineService');
	const vaccineDoctor = searchParams.get('vaccineDoctor');

	const [open, setOpen] = useState<boolean>(() => Boolean(reminderId));
	const operationKeyRef = useRef<string | null>(null);

	const form = useForm({
		resolver: zodResolver(createVaccineSchema),
		shouldUnregister: true,
		defaultValues: {
			petId,
			reminderId: reminderId ?? undefined,
			name: vaccineName ?? '',
			serviceId: vaccineService ?? undefined,
			applicationDate: new Date(),
			nextDoseType: 'booster' as const,
			daysToNextDose: undefined,
			lotNumber: '',
			manufacturer: '',
			doctorId: vaccineDoctor ?? REGINA_DOCTOR_ID,
		},
	});

	const selectedServiceId = useWatch({
		control: form.control,
		name: 'serviceId',
	});
	const selectedService = vaccineServices.find(
		(service) => service.id === selectedServiceId,
	);

	const nextDoseType = useWatch({
		control: form.control,
		name: 'nextDoseType',
	});

	const insertVaccineAction = useAction(insertVaccine, {
		onSuccess: () => {
			toast.success(
				reminderId
					? 'Vacinação registrada e lembrete concluído com sucesso!'
					: 'Registro de vacinação salvo com sucesso!',
			);

			operationKeyRef.current = null;
			setOpen(false);
			form.reset();

			if (reminderId) {
				router.replace(`/pets/${petId}`);
			}

			router.refresh();
		},
		onError: ({ error }) => {
			toast.error(
				error.serverError ?? 'Não foi possível salvar o registro de vacinação.',
			);
		},
	});

	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			operationKeyRef.current = null;
			form.reset();
		}
	};

	const onSubmit = (data: CreateVaccineSchema) => {
		console.log('Formulário de vacina validado. Enviando action.');
		operationKeyRef.current ??= crypto.randomUUID();
		insertVaccineAction.execute({
			...buildVaccineSubmitPayload(data, reminderId),
			...(appointmentId ? { appointmentId } : {}),
			operationKey: operationKeyRef.current,
		});
	};

	const onInvalid = (
		errors: FieldErrors<z.input<typeof createVaccineSchema>>,
	) => {
		console.error('Erros de validação da vacina:', errors);

		const firstError = Object.values(errors).find((error) => error?.message);

		toast.error(
			typeof firstError?.message === 'string'
				? firstError.message
				: 'Verifique os campos obrigatórios da vacina.',
		);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button className='bg-vaccine hover:bg-vaccine/80'>
					<SyringeIcon />
					Vacinas
				</Button>
			</DialogTrigger>

			<DialogContent
				onInteractOutside={(e) => e.preventDefault()}
				showCloseButton={false}
				className='flex max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-lg flex-col gap-3 overflow-y-auto p-4 sm:p-6'
			>
				<DialogHeader>
					<DialogTitle>
						{reminderId ? 'Concluir vacinação' : 'Nova Vacina'}
					</DialogTitle>

					<DialogDescription>
						{reminderId
							? 'Confirme os dados da aplicação para concluir o lembrete e programar o próximo reforço.'
							: 'Informe os dados da vacina aplicada e a data de retorno'}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						id='vaccineForm'
						noValidate
						onSubmit={(event) => {
							void form.handleSubmit(onSubmit, onInvalid)(event);
						}}
						className='min-w-0 space-y-4'
					>
						<input type='hidden' {...form.register('petId')} />

						{vaccineServices.length === 0 ? (
							<div className='space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100' role='status'>
								<p className='font-semibold'>Nenhuma vacina disponível no catálogo para este paciente.</p>
								<p>Em Serviços, marque o tipo <strong>Vacinação</strong> e confira se a espécie corresponde à do pet. Você ainda pode registrar uma vacina antiga pelo nome abaixo, sem vínculo comercial.</p>
								<Button variant='outline' size='sm' asChild className='w-full sm:w-auto'>
									<Link href='/services' target='_blank' rel='noopener noreferrer'>Abrir catálogo de serviços</Link>
								</Button>
							</div>
						) : (
							<SelectForm
								label='Vacina no catálogo de serviços'
								name='serviceId'
								control={form.control}
								options={vaccineServices.map((service) => ({
									value: service.id,
									label: service.name,
								}))}
								onSelect={(value) => {
									const service = vaccineServices.find(
										(item) => item.id === value,
									);
									if (service)
										form.setValue('name', service.name, {
											shouldValidate: true,
										});
								}}
								placeholder='Selecione a vacina aplicada'
							/>
						)}

						{selectedService && (
							<p className='rounded-md border p-2 text-sm text-muted-foreground'>
								Preço de referência:{' '}
								{(selectedService.priceInCents / 100).toLocaleString('pt-BR', {
									style: 'currency',
									currency: 'BRL',
								})}
								. Uma aplicação registrada hoje cria atendimento com valor;
								registros de datas anteriores ficam com valor financeiro zero.
							</p>
						)}

						{
							<InputForm
								label={selectedService ? 'Nome da vacina (preenchido pelo catálogo)' : 'Nome da vacina (registro manual)'}
								name='name'
								placeholder='Ex: Raiva, V10, Gripe...'
								register={form.register}
								error={form.formState.errors.name?.message}
							/>
						}

						<div className='flex flex-col gap-4'>
							<DatePickerForm
								label='Data da Aplicação'
								name='applicationDate'
								control={form.control}
								className='w-full'
								error={form.formState.errors.applicationDate?.message}
							/>

							<SelectForm
								label='Próxima dose'
								name='nextDoseType'
								control={form.control}
								options={[
									{
										value: 'booster',
										label: 'Reforço em alguns dias',
									},
									{
										value: 'annual',
										label: 'Reforço anual',
									},
									{
										value: 'none',
										label: 'Sem próxima dose',
									},
								]}
								error={form.formState.errors.nextDoseType?.message}
							/>

							{nextDoseType === 'booster' && (
								<InputForm
									label='Dias para Próxima Dose'
									name='daysToNextDose'
									type='number'
									placeholder='Ex: 21 ou 30'
									register={form.register}
									error={form.formState.errors.daysToNextDose?.message}
								/>
							)}

							{nextDoseType === 'annual' && (
								<p className='text-sm text-muted-foreground'>
									O lembrete será criado automaticamente para 1 ano após a
									aplicação.
								</p>
							)}

							{nextDoseType === 'none' && (
								<p className='text-sm text-muted-foreground'>
									Nenhum lembrete de próxima dose será criado.
								</p>
							)}
						</div>

						<SelectForm
							label='Veterinário'
							name='doctorId'
							options={doctors.map((doctor) => ({
								value: doctor.id,
								label: doctor.user.name,
							}))}
							control={form.control}
							error={form.formState.errors.doctorId?.message}
							placeholder='Selecione um veterinário'
						/>

						<InputForm
							label='Número do Lote'
							name='lotNumber'
							register={form.register}
							placeholder='Ex: 123456'
							error={form.formState.errors.lotNumber?.message}
						/>

						<InputForm
							label='Fabricante'
							name='manufacturer'
							register={form.register}
							placeholder='Ex: Zoetis'
							error={form.formState.errors.manufacturer?.message}
						/>
					</form>
				</Form>

				<DialogFooter className='mt-2 flex flex-col gap-2 border-t pt-3 sm:flex-row'>
					<DialogClose asChild>
						<Button
							type='button'
							variant={'destructive'}
							disabled={insertVaccineAction.isPending}
							className='flex-1'
						>
							<BanIcon /> Cancelar
						</Button>
					</DialogClose>

					<Button
						type='submit'
						disabled={insertVaccineAction.isPending}
						form='vaccineForm'
						className='flex-1'
					>
						{insertVaccineAction.isPending ? (
							<Loader2Icon className='h-5 w-5 animate-spin' />
						) : (
							<SaveIcon />
						)}
						Salvar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default DialogVaccine;

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
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

interface DialogVaccineProps {
	petId: string;
	doctors: DoctorsWithRelations[];
}

const DialogVaccine = ({ petId, doctors }: DialogVaccineProps) => {
	const [open, setOpen] = useState<boolean>(false);

	const form = useForm({
		resolver: zodResolver(createVaccineSchema),
		shouldUnregister: true,
		defaultValues: {
			petId,
			name: '',
			applicationDate: new Date(),
			nextDoseType: 'booster' as const,
			daysToNextDose: undefined,
			lotNumber: '',
			manufacturer: '',
			doctorId: REGINA_DOCTOR_ID,
		},
	});

	const nextDoseType = useWatch({
		control: form.control,
		name: 'nextDoseType',
	});

	const insertVaccineAction = useAction(insertVaccine, {
		onSuccess: () => {
			toast.success('Registro de vacinação salvo com sucesso!');
			setOpen(false);
			form.reset();
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
			form.reset();
		}
	};

	const onSubmit = (data: CreateVaccineSchema) => {
		insertVaccineAction.execute(data);
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
				className='max-w-md'
			>
				<DialogHeader>
					<DialogTitle>Nova Vacina</DialogTitle>
					<DialogDescription>
						Informe os dados da vacina aplicada e a data de retorno
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						id='vaccineForm'
						onSubmit={form.handleSubmit(onSubmit)}
						className='space-y-4'
					>
						<input type='hidden' {...form.register('petId')} />

						<InputForm
							label='Nome da Vacina'
							name='name'
							placeholder='Ex: Raiva, V10, Gripe...'
							register={form.register}
							error={form.formState.errors.name?.message}
						/>

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

				<DialogFooter className='mt-4'>
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

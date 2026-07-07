import { upsertShift } from '@/api/actions/shifts.actions';
import { REGINA_DOCTOR_ID } from '@/api/config/consts';
import { DoctorsWithRelations } from '@/api/schema/doctors.schema';
import {
	createShiftSchema,
	CreateShiftSchema,
	ShiftsWithRelations,
} from '@/api/schema/shifts.schema';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { differenceInHours } from 'date-fns';
import { BanIcon, Loader2Icon, SaveIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface ShiftFormProps {
	shift?: ShiftsWithRelations;
	doctors: DoctorsWithRelations[];
	selectedDate?: Date | null;
	onSuccess?: () => void;
}

const ShiftFormClient = ({
	shift,
	doctors,
	selectedDate,
	onSuccess,
}: ShiftFormProps) => {
	const defaultShiftTime = 12;
	const shiftStart = shift?.startTime
		? new Date(shift.startTime)
		: selectedDate || new Date();
	const shiftEnd = shift?.endTime ? new Date(shift.endTime) : null;

	// Calcula a duração se o shift existir, senão usa o padrão
	const calculatedDuration: string = shiftEnd
		? differenceInHours(shiftEnd, shiftStart).toString()
		: '12'; // fallback padrão

	const form = useForm<CreateShiftSchema>({
		resolver: zodResolver(createShiftSchema),
		defaultValues: {
			doctorId: shift?.doctorId || REGINA_DOCTOR_ID,
			clinicName: shift?.clinicName || '',
			startTime: shift?.startTime
				? new Date(shift.startTime)
				: selectedDate || new Date(),
			duration: calculatedDuration,
			requesterName: shift?.requesterName || undefined,
			amountInCents: shift?.amountInCents
				? shift.amountInCents / 100
				: undefined,
			isPaid: shift?.isPaid || false,
		},
	});

	const formSubmit = (data: CreateShiftSchema) => {
		upsertShiftAction.execute({
			...data,
			id: shift?.id,
		});
	};

	const upsertShiftAction = useAction(upsertShift, {
		onSuccess: () => {
			onSuccess?.();
			toast.success('Plantão salvo com sucesso!');
			form.reset();
		},
		onError: (err) => {
			console.error('Erro ao salvar plantão:', err);
			toast.error('Ocorreu um erro ao salvar o plantão.');
		},
	});

	return (
		<DialogContent
			onInteractOutside={(e) => e.preventDefault()}
			showCloseButton={false}
		>
			<DialogHeader>
				<DialogTitle>
					{shift ? 'Editar Plantão' : 'Cadastrar Plantão'}
				</DialogTitle>
				<DialogDescription>
					{shift
						? 'Edite as informações do seu plantão selecionado'
						: 'Adicione um novo plantão na agenda'}
				</DialogDescription>
			</DialogHeader>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(formSubmit)}>
					<div className='flex flex-col gap-2 max-h-100 overflow-y-auto px-1 sm:max-h-none sm:overflow-visible'>
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

						<div className='flex flex-col lg:flex-row gap-4'>
							<DateTimePickerForm
								control={form.control}
								label='Data/Hora de início:'
								name='startTime'
								error={form.formState.errors.startTime?.message}
							/>

							<InputForm
								register={form.register}
								label='Duração (em horas):'
								name='duration'
								error={form.formState.errors.duration?.message}
								defaultValue={defaultShiftTime}
								type='number'
								min={1}
								max={24}
							/>
						</div>

						<InputForm
							register={form.register}
							label='Nome da clínica:'
							name='clinicName'
							error={form.formState.errors.clinicName?.message}
						/>

						<div className='flex flex-col lg:flex-row gap-4'>
							<InputForm
								register={form.register}
								label='Solicitante:'
								name='requesterName'
								error={form.formState.errors.requesterName?.message}
							/>

							<MoneyInputForm
								control={form.control}
								label='Valor:'
								name='amountInCents'
								error={form.formState.errors.amountInCents?.message}
							/>

							<SelectForm
								control={form.control}
								label='Pago?'
								name='isPaid'
								error={form.formState.errors.isPaid?.message}
								options={[
									{
										value: true,
										label: 'Sim',
									},
									{
										value: false,
										label: 'Não',
									},
								]}
							/>
						</div>
					</div>

					{upsertShiftAction.isPending && <LoadingDialog />}

					<DialogFooter className='mt-4'>
						<DialogClose asChild>
							<Button type='button' variant={'destructive'} className='flex-1'>
								<BanIcon />
								Cancelar
							</Button>
						</DialogClose>

						<Button type='submit' className='flex-1'>
							{upsertShiftAction.isPending ? (
								<Loader2Icon className='h-5 w-5 animate-spin' />
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

export default ShiftFormClient;

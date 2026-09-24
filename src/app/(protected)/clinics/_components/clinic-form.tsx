'use client';

import { upsertClinic } from '@/api/actions/clinics.actions';
import { searchAddressByPostalCode } from '@/api/config/consts';
import {
	Clinics,
	createClinicSchema,
	CreateClinicSchema,
} from '@/api/schema/clinics.schema';
import CheckboxForm from '@/components/form/checkbox-form';
import InputForm from '@/components/form/input-form';
import InputFormMask from '@/components/form/input-mask-form';
import MoneyInputForm from '@/components/form/money-input-form';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { BanIcon, Loader2Icon, SaveIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface ClinicFormClientProps {
	clinic?: Clinics;
	onSuccess?: () => void;
}

const ClinicFormClient = ({ clinic, onSuccess }: ClinicFormClientProps) => {
	const form = useForm<CreateClinicSchema>({
		resolver: zodResolver(createClinicSchema),
		shouldUnregister: true,
		defaultValues: {
			id: clinic?.id || undefined,
			name: clinic?.name || '',
			phone: clinic?.phone || '',
			defaultShiftPriceInCents:
				clinic?.defaultShiftPriceInCents !== undefined
					? fromCents(clinic.defaultShiftPriceInCents)
					: 0,
			isActive: clinic?.isActive ?? true,
			postalCode: clinic?.postalCode || '',
			address: clinic?.address || '',
			addressNumber: clinic?.addressNumber || '',
			neighborhood: clinic?.neighborhood || '',
			city: clinic?.city || '',
			state: clinic?.state || '',
		},
	});

	const handlePostalCodeChange = async (postalCode: string) => {
		if (!postalCode) return;
		const fullAddress = await searchAddressByPostalCode(postalCode);

		if (fullAddress.erro) toast.error('CEP não encontrado!');

		form.setValue('address', fullAddress.logradouro);
		form.setValue('neighborhood', fullAddress.bairro);
		form.setValue('city', fullAddress.localidade);
		form.setValue('state', fullAddress.uf);
	};

	const formSubmit = (data: CreateClinicSchema) => {
		upsertClinicAction.execute({
			...data,
			id: clinic?.id,
		});
	};

	const upsertClinicAction = useAction(upsertClinic, {
		onSuccess: () => {
			onSuccess?.();
			toast.success(
				clinic
					? 'Clínica atualizada com sucesso!'
					: 'Clínica cadastrada com sucesso!',
			);
			form.reset();
		},
		onError: (error) => {
			console.error({ error });
			toast.error('Ocorreu um erro ao salvar a clínica: ' + { error });
		},
	});

	return (
		<DialogContent
			onInteractOutside={(e) => e.preventDefault()}
			showCloseButton={false}
		>
			<DialogHeader>
				<DialogTitle>
					{clinic ? 'Atualizar Clínica' : 'Cadastrar Clínica'}
				</DialogTitle>
				<DialogDescription>
					{clinic
						? 'Atualize as informações da clínica selecionada'
						: 'Adicione uma nova clínica para cadastrar plantões'}
				</DialogDescription>
			</DialogHeader>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(formSubmit)} id='clinicForm'>
					<div className='flex max-h-[calc(100dvh-12rem)] min-w-0 flex-col gap-2 overflow-y-auto px-1'>
						<InputForm
							label='Nome:'
							register={form.register}
							name='name'
							error={form.formState.errors.name?.message}
						/>

						<div className='flex flex-col lg:flex-row gap-4 w-full'>
							<InputFormMask
								label='Telefone:'
								control={form.control}
								error={form.formState.errors.phone?.message}
								format='(##) #####-####'
								mask='x'
								name='phone'
							/>

							<MoneyInputForm
								label='Valor do plantão:'
								control={form.control}
								error={form.formState.errors.defaultShiftPriceInCents?.message}
								name='defaultShiftPriceInCents'
							/>
						</div>

						<CheckboxForm
							label='Clínica ativa'
							name='isActive'
							control={form.control}
							error={form.formState.errors.isActive?.message}
						/>

						<div className='flex flex-row gap-4'>
							<InputFormMask
								label='CEP:'
								control={form.control}
								error={form.formState.errors.postalCode?.message}
								format='#####-###'
								mask='x'
								name='postalCode'
								onBlur={(event) => handlePostalCodeChange(event.target.value)}
							/>

							<InputForm
								label='Número:'
								register={form.register}
								error={form.formState.errors.addressNumber?.message}
								name='addressNumber'
								type='number'
							/>
						</div>

						<InputForm
							label='Endereço:'
							register={form.register}
							name='address'
							error={form.formState.errors.address?.message}
							disabled
						/>

						<InputForm
							label='Bairro:'
							register={form.register}
							name='neighborhood'
							error={form.formState.errors.neighborhood?.message}
							disabled
						/>

						<div className='flex flex-row gap-4'>
							<InputForm
								label='Cidade:'
								register={form.register}
								name='city'
								error={form.formState.errors.city?.message}
								disabled
							/>

							<InputForm
								label='Estado:'
								register={form.register}
								name='state'
								error={form.formState.errors.state?.message}
								disabled
								className='w-30'
							/>
						</div>
					</div>
				</form>
			</Form>

			{upsertClinicAction.isPending && <LoadingDialog />}

			<DialogFooter className='mt-4'>
				<DialogClose asChild>
					<Button
						type='button'
						variant={'destructive'}
						onClick={() => {
							if (!upsertClinicAction.isPending) form.reset();
						}}
						className='flex-1'
					>
						<BanIcon />
						Cancelar
					</Button>
				</DialogClose>

				<Button
					type='submit'
					disabled={upsertClinicAction.isPending}
					form='clinicForm'
					className='flex-1'
				>
					{upsertClinicAction.isPending ? (
						<Loader2Icon className='h-5 w-5 animate-spin' />
					) : (
						<>
							<SaveIcon />
							Salvar
						</>
					)}
				</Button>
			</DialogFooter>
		</DialogContent>
	);
};

export default ClinicFormClient;

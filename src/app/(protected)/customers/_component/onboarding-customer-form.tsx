'use client';

import { onboardingCustomer } from '@/api/actions/customers.actions';
import { searchAddressByPostalCode } from '@/api/config/consts';
import { OnboardingCustomerSchema, onboardingCustomerSchema } from '@/api/schema/customers.schema';
import InputForm from '@/components/form/input-form';
import InputFormMask from '@/components/form/input-mask-form';
import SelectForm from '@/components/form/select-form';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import LoadingDialog from '@/components/ui/loading';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon, SaveIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

const OnboardingCustomerFormDialog = ({ isOpen }: { isOpen: boolean }) => {
	const form = useForm<OnboardingCustomerSchema>({
		resolver: zodResolver(onboardingCustomerSchema),
		shouldUnregister: true,
		defaultValues: {
			phone: '',
			cpf: '',
			gender: 'female',
			postalCode: '',
			address: '',
			addressNumber: '',
			neighborhood: '',
			city: '',
			state: '',
		},
	});

	const handlePostalCodeChange = async (postalCode: string) => {
		const fullAddress = await searchAddressByPostalCode(postalCode);
		form.setValue('address', fullAddress.logradouro);
		form.setValue('neighborhood', fullAddress.bairro);
		form.setValue('city', fullAddress.localidade);
		form.setValue('state', fullAddress.uf);
	};

	const formSubmit = (data: OnboardingCustomerSchema) => {
		onboardingCustomerAction.execute({
			...data,
		});
	};

	const onboardingCustomerAction = useAction(onboardingCustomer, {
		onSuccess: () => {
			toast.success('Dados atualizados com sucesso!');
			form.reset();
		},
		onError: (error) => {
			console.error({ error });
			toast.error('Ocorreu um erro ao salvar o cliente!');
		},
	});

	return (
		<Dialog open={isOpen}>
			<DialogContent
				className='sm:max-w-xl'
				onPointerDownOutside={(e) => e.preventDefault()}
				showCloseButton={false}
			>
				<Form {...form}>
					<form id='registerForm' onSubmit={form.handleSubmit(formSubmit)} className='flex flex-col gap-2'>
						<DialogHeader>
							<DialogTitle>Complete seu cadastro</DialogTitle>
							<DialogDescription>
								Precisamos de mais alguns dados para finalizar o seu cadastro no sistema.
							</DialogDescription>
						</DialogHeader>

						<span className='flex flex-col lg:flex-row gap-4'>
							<InputFormMask
								label='Telefone:'
								control={form.control}
								error={form.formState.errors.phone?.message}
								format='(##) #####-####'
								mask='x'
								name='phone'
							/>

							<InputFormMask
								label='CPF:'
								control={form.control}
								error={form.formState.errors.cpf?.message}
								format='###.###.###-##'
								mask='x'
								name='cpf'
							/>

							<SelectForm
								label='Sexo:'
								control={form.control}
								error={form.formState.errors.gender?.message}
								name='gender'
								options={[
									{
										value: 'male',
										label: 'Masculino',
										key: 'male',
									},
									{
										value: 'female',
										label: 'Feminino',
										key: 'female',
									},
								]}
							/>
						</span>

						<span className='flex gap-4'>
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
						</span>

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

						<span className='flex gap-4'>
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
							/>
						</span>

						{onboardingCustomerAction.isPending && <LoadingDialog />}

						<DialogFooter>
							<Button type='submit' disabled={onboardingCustomerAction.isPending} className='flex-1'>
								{onboardingCustomerAction.isPending ? (
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
		</Dialog>
	);
};

export default OnboardingCustomerFormDialog;

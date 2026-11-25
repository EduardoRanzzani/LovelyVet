'use client';

import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

const formData = z.object({
	itemOne: z.string().min(1, { message: 'Item obrigatório' }),
	itemTwo: z.string().min(1, { message: 'Item obrigatório' }),
	itemThree: z.string().min(1, { message: 'Item obrigatório' }),
});

type RuleOfThreeValues = z.infer<typeof formData>;

const RuleOfThree = () => {
	const [result, setResult] = useState<string>('');

	const form = useForm<RuleOfThreeValues>({
		resolver: zodResolver(formData),
		defaultValues: {
			itemOne: '',
			itemTwo: '',
			itemThree: '',
		},
		shouldUnregister: true,
	});

	useEffect(() => {
		return () => {
			form.reset();
			setResult('');
		};
	}, [form]);

	const performCalculation = useCallback((data: RuleOfThreeValues) => {
		if (!data.itemOne || !data.itemTwo || !data.itemThree) {
			setResult('');
			return;
		}

		const itemOne = Number(data.itemOne.replace(',', '.'));
		const itemTwo = Number(data.itemTwo.replace(',', '.'));
		const itemThree = Number(data.itemThree.replace(',', '.'));

		if (itemOne === 0) {
			toast.error('O primeiro elemento não pode ser zero');
			setResult('Erro');
			return;
		}

		const calculatedValue = (itemTwo * itemThree) / itemOne;
		setResult(calculatedValue.toFixed(2).replace('.', ','));
	}, []);

	const handleBlur = () => {
		const values = form.getValues();
		performCalculation(values);
	};

	return (
		<DialogContent onInteractOutside={(e) => e.preventDefault()}>
			<DialogHeader>
				<DialogTitle>Regra de Três Simples</DialogTitle>
				<DialogDescription>Preencha os campos abaixo para calcular automaticamente.</DialogDescription>
			</DialogHeader>

			<Form {...form}>
				<form className='flex flex-col gap-2'>
					<div className='flex items-center justify-center mt-6'>
						<Input
							{...form.register('itemOne')}
							onBlur={(e) => {
								form.register('itemOne').onBlur(e); // Chama o blur do hook-form
								handleBlur(); // Chama o seu cálculo
							}}
							type='number'
							placeholder='A'
							className='w-2/5 text-center z-2'
						/>

						<p className='text-xs text-center font-medium bg-muted py-1 w-1/5 z-1'>Está para</p>

						<Input
							{...form.register('itemTwo')}
							onBlur={(e) => {
								form.register('itemTwo').onBlur(e);
								handleBlur();
							}}
							type='number'
							placeholder='B'
							className='w-2/5 text-center z-2'
						/>
					</div>

					<p className='text-sm text-center uppercase font-bold my-4 text-muted-foreground'>Assim como</p>

					<div className='flex items-center mb-4'>
						<Input
							{...form.register('itemThree')}
							onBlur={(e) => {
								form.register('itemThree').onBlur(e);
								handleBlur();
							}}
							type='number'
							placeholder='C'
							className='w-2/5 text-center z-2'
						/>
						<p className='text-xs text-center font-medium bg-muted py-1 w-1/5 z-1'>Está para</p>
						<Input
							readOnly
							value={result}
							placeholder='Resultado'
							className='bg-secondary/50 font-bold w-2/5 text-center z-2'
						/>
					</div>
				</form>
			</Form>
			<DialogFooter className='mt-6'></DialogFooter>
		</DialogContent>
	);
};

export default RuleOfThree;

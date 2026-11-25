'use client';

import InputForm from '@/components/form/input-form';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalculatorIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';

const formData = z.object({
	weight: z.string().min(1, { message: 'Peso obrigatório para o cálculo' }),
	dose: z.string().min(1, { message: 'Dose obrigatória para o cálculo' }),
	solute: z.string().min(1, { message: 'Solução obrigatória para o cálculo' }),
	solvent: z.string().min(1, { message: 'Solvente obrigatório para o cálculo' }),
});

const DoseCalculation = () => {
	const [result, setResult] = useState<string>('0');

	const form = useForm<z.infer<typeof formData>>({
		resolver: zodResolver(formData),
		shouldUnregister: true,
	});

	const calculateDose = (data: z.infer<typeof formData>) => {
		let concentration: number = Number(data.solute) / Number(data.solvent);
		concentration = concentration * 1000; // converting to mcg

		const tax: number = (Number(data.weight) * Number(data.dose) * 60) / concentration;

		setResult(tax.toFixed(2));
	};

	return (
		<DialogContent onInteractOutside={(e) => e.preventDefault()}>
			<DialogHeader>
				<DialogTitle>Dosagem Noradrenalina</DialogTitle>
				<DialogDescription>
					Preencha os campos abaixo para saber a dosagem necessária para a bomba de infusão
				</DialogDescription>
			</DialogHeader>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(calculateDose)} className='flex flex-col gap-2'>
					<div className='flex flex-col lg:flex-row items-center justify-center gap-2'>
						<InputForm
							register={form.register}
							label='Peso (kg)'
							name='weight'
							type='number'
							step={0.1}
							error={form.formState.errors.weight?.message}
						/>

						<InputForm
							register={form.register}
							label='Dose (mg)'
							name='dose'
							type='number'
							step={0.1}
							error={form.formState.errors.dose?.message}
						/>
					</div>
					<div className='flex flex-col lg:flex-row items-center justify-center gap-2'>
						<InputForm
							register={form.register}
							label='Solução'
							name='solute'
							type='number'
							step={0.1}
							error={form.formState.errors.solute?.message}
						/>

						<InputForm
							register={form.register}
							label='Solvente'
							name='solvent'
							type='number'
							step={0.1}
							error={form.formState.errors.solvent?.message}
						/>
					</div>

					<Button type='submit' className='mt-4 w-full'>
						<CalculatorIcon />
						Calcular
					</Button>
				</form>
			</Form>

			<DialogFooter className='mt-6'>
				<h1 className='font-semibold text-center w-full'>Resultado: {result} ml/h</h1>
			</DialogFooter>
		</DialogContent>
	);
};

export default DoseCalculation;

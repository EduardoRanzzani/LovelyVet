'use client';
import DatePickerForm from '@/components/form/datepicker-form';
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
	initialDate: z.date().nonoptional({ message: 'Data inicial obrigatória' }),
	finalDate: z.date().nonoptional({ message: 'Data final obrigatória' }),
	result: z.string().optional(),
});

type FormSchema = z.infer<typeof formData>;

const DaysBetween = () => {
	const [result, setResult] = useState<number>(0);

	const form = useForm<FormSchema>({
		resolver: zodResolver(formData),
		defaultValues: {
			initialDate: new Date(),
			finalDate: new Date(),
		},
	});

	const formSubmit = (data: FormSchema) => {
		// calcular dias entre as datas final - inicial
		const initialDate = data.initialDate;
		const finalDate = data.finalDate;

		const days = Math.round((finalDate.getTime() - initialDate.getTime()) / (1000 * 60 * 60 * 24));

		setResult(days);
	};

	return (
		<DialogContent onInteractOutside={(e) => e.preventDefault()}>
			<DialogHeader>
				<DialogTitle>Dias entre datas</DialogTitle>
				<DialogDescription>Saiba exatamente quantos dias há entre duas datas.</DialogDescription>
			</DialogHeader>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(formSubmit)}>
					<div className='flex flex-col lg:flex-row gap-2'>
						<DatePickerForm
							control={form.control}
							name='initialDate'
							label='Data Inicial'
							showFuture={true}
							error={form.formState.errors.initialDate?.message}
						/>

						<DatePickerForm
							control={form.control}
							name='finalDate'
							label='Data Final'
							showFuture={true}
							error={form.formState.errors.finalDate?.message}
						/>
					</div>

					<div className='mt-2'>
						<InputForm
							register={form.register}
							value={result}
							name='result'
							label='Resultado'
							disabled
							error={form.formState.errors.result?.message}
						/>
					</div>

					<DialogFooter className='mt-6'>
						<Button type='submit' className='w-full lg:w-1/2'>
							<CalculatorIcon />
							Calcular
						</Button>
					</DialogFooter>
				</form>
			</Form>
		</DialogContent>
	);
};

export default DaysBetween;

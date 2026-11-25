import DatePickerForm from '@/components/form/datepicker-form';
import InputForm from '@/components/form/input-form';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MinusIcon, PlusIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import z from 'zod';

const formData = z.object({
	initialDate: z.date().nonoptional({ message: 'Data obrigatória' }),
	days: z.string().min(1, { message: 'Dias devem ser positivos' }),
	result: z.date().optional(),
});

const AddDaysToDate = () => {
	const form = useForm<z.infer<typeof formData>>({
		resolver: zodResolver(formData),
		defaultValues: {
			initialDate: new Date(),
		},
	});

	const calculateDays = (data: z.infer<typeof formData>) => {
		const initialDate = data.initialDate;
		const days = Number(data.days);

		const newDate = new Date(initialDate);
		newDate.setDate(newDate.getDate() + days);

		form.setValue('result', newDate);
	};

	const substractDays = (data: z.infer<typeof formData>) => {
		const initialDate = data.initialDate;
		const days = Number(data.days);

		const newDate = new Date(initialDate);
		newDate.setDate(newDate.getDate() - days);

		form.setValue('result', newDate);
	};

	return (
		<DialogContent
			onInteractOutside={(e) => {
				e.preventDefault();
			}}
		>
			<DialogHeader>
				<DialogTitle>Somar/Subtrair dias a uma Data</DialogTitle>
				<DialogDescription>
					Saiba exatamente o dia resultante da soma/subtração a partir da data atual
				</DialogDescription>
			</DialogHeader>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(calculateDays)}>
					<div className='flex flex-col lg:flex-row gap-2'>
						<DatePickerForm
							control={form.control}
							name='initialDate'
							label='Data Inicial'
							showFuture={true}
							error={form.formState.errors.initialDate?.message}
						/>

						<InputForm
							label='Dias'
							register={form.register}
							name='days'
							type='number'
							step={1}
							error={form.formState.errors.days?.message}
						/>
					</div>

					<div className='mt-2'>
						<DatePickerForm
							control={form.control}
							label='Resultado'
							name='result'
							placeholder='Preencha os dados para calcular'
							disabled
							showFuture={true}
							error={form.formState.errors.result?.message}
						/>
					</div>

					<DialogFooter className='mt-6'>
						<Button
							type='button'
							className='w-full lg:w-1/2'
							onClick={() => substractDays(form.getValues())}
						>
							<MinusIcon />
							Subtrair
						</Button>

						<Button type='submit' className='w-full lg:w-1/2'>
							<PlusIcon />
							Somar
						</Button>
					</DialogFooter>
				</form>
			</Form>
		</DialogContent>
	);
};

export default AddDaysToDate;

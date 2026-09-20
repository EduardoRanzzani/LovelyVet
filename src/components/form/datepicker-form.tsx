import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

interface DatePickerFormProps<T extends FieldValues> {
	label: string;
	error?: string;
	name: Path<T>;
	control: Control<T>;
	required?: boolean;
	disabled?: boolean;
	placeholder?: string;
	className?: string;
	showFuture?: boolean;
}

const DatePickerForm = <T extends FieldValues>({
	label,
	error,
	name,
	control,
	required,
	disabled,
	placeholder = 'Selecione uma data',
	className,
	showFuture = false,
}: DatePickerFormProps<T>) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Field className={cn('flex min-w-0 flex-col gap-1', className)}>
			<Label className='text-xs font-medium'>
				{label} {required && <span className='text-destructive'>*</span>}
			</Label>

			<Controller
				name={name}
				control={control}
				render={({ field }) => {
					const displayMonth = field.value ? new Date(field.value) : new Date();

					return (
						<Popover open={isOpen} onOpenChange={setIsOpen}>
							<PopoverTrigger asChild>
								<Button
									variant='outline'
									disabled={disabled}
									className={cn(
										'w-full justify-start text-left font-normal h-9 px-3',
										!field.value && 'text-muted-foreground',
										error && 'border-destructive',
									)}
								>
									<CalendarIcon className='mr-2 h-4 w-4' />
									{field.value ? (
										format(field.value, 'dd/MM/yyyy')
									) : (
										<span>{placeholder}</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent className='w-auto p-0' align='start'>
								<Calendar
									mode='single'
									selected={field.value}
									onSelect={(date) => {
										field.onChange(date);
										setIsOpen(false);
									}}
									defaultMonth={displayMonth}
									// CONFIGURAÇÃO PARA DROPDOWNS
									captionLayout='dropdown' // O seu calendar.tsx usa dropdown_root para estilizar isso
									fromYear={1900}
									toYear={new Date().getFullYear() + 10}
									// Bloqueia datas futuras se for para nascimento
									disabled={(date) => !showFuture && date > new Date()}
									locale={ptBR}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
					);
				}}
			/>

			{error && <p className='text-xs text-destructive mt-1'>{error}</p>}
		</Field>
	);
};

export default DatePickerForm;

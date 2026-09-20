'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field'; // Verifique se este é o seu container de campo
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

interface CheckboxFormProps<T extends FieldValues> {
	label: string;
	name: Path<T>;
	control: Control<T>;
	error?: string;
	className?: string;
	disabled?: boolean;
}

const CheckboxForm = <T extends FieldValues>({
	label,
	name,
	control,
	error,
	className,
	disabled,
}: CheckboxFormProps<T>) => {
	const inputId = `checkbox-${name}`;

	return (
		<Field className={cn('flex min-w-0 flex-col gap-1', className)}>
			<Label htmlFor={inputId} className='text-xs font-medium'>
				{label}
			</Label>

			<Controller
				name={name}
				control={control}
				render={({ field }) => (
					<Checkbox
						id={inputId}
						checked={field.value}
						onCheckedChange={field.onChange}
						disabled={disabled}
						className='w-9 h-9'
					/>
				)}
			/>
			{error && <p className='text-xs text-destructive mt-1'>{error}</p>}
		</Field>
	);
};

export default CheckboxForm;

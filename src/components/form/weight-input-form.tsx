import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

interface WeightInputFormProps<T extends FieldValues> extends Omit<
	NumericFormatProps,
	'name'
> {
	label: string;
	error?: string;
	name: Path<T>;
	control: Control<T>;
	required?: boolean;
}

const WeightInputForm = <T extends FieldValues>({
	label,
	error,
	name,
	control,
	className,
	required,
	disabled,
	...props
}: WeightInputFormProps<T>) => {
	const inputId = props.id || name;

	return (
		<Field className={cn('flex min-w-0 flex-col gap-1', className)}>
			<Label htmlFor={inputId} className='text-xs font-medium'>
				{label} {required && <span className='text-destructive'>*</span>}
			</Label>

			<Controller
				name={name}
				control={control}
				render={({ field: { onChange, value, ref } }) => (
					<NumericFormat
						{...props}
						getInputRef={ref}
						id={inputId}
						value={value}
						onValueChange={(values) => {
							// Retorna o valor como número (ex: 12.5) para o Zod/Drizzle
							onChange(values.floatValue);
						}}
						disabled={disabled}
						// Configurações para Peso (Ex: 15,500 kg)
						decimalScale={3} // 3 casas decimais para precisão de gramas em Kg
						fixedDecimalScale={false} // Não força .000 se não for necessário
						decimalSeparator=','
						thousandSeparator='.'
						suffix=' kg'
						allowNegative={false}
						customInput={Input}
						placeholder='0,000 kg'
						className={cn(
							'w-full read-only:cursor-not-allowed read-only:bg-zinc-100 dark:read-only:bg-zinc-800',
							error && 'border-destructive',
						)}
					/>
				)}
			/>

			{error && <p className='text-xs text-destructive mt-1'>{error}</p>}
		</Field>
	);
};

export default WeightInputForm;

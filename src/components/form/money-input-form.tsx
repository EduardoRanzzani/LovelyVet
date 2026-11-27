import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Control, Controller, FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

// Estendemos as props do NumericFormat para manter o comportamento de moeda
interface MoneyInputFormProps<T extends FieldValues> extends Omit<NumericFormatProps, 'name'> {
	label: string;
	/** Mantém a entrada decimal como texto durante a edição. */
	preserveNumericString?: boolean;
	error?: string;
	name: Path<T>;
	control: Control<T>; // Usamos Control em vez de Register para componentes controlados
	rules?: RegisterOptions<T, Path<T>>;
}

const MoneyInputForm = <T extends FieldValues>({
	label,
	error,
	name,
	control,
	rules,
	className,
	required,
	disabled,
	preserveNumericString = false,
	...props
}: MoneyInputFormProps<T>) => {
	const inputId = props.id || name;

	return (
		<Field className={cn('flex min-w-0 flex-col gap-1', className)}>
			<Label htmlFor={inputId} className='text-xs font-medium'>
				{label} {required && <span className='text-destructive'>*</span>}
			</Label>

			<Controller
				name={name}
				control={control}
				rules={rules}
				render={({ field: { onChange, onBlur, value, ref } }) => (
					<NumericFormat
						{...props}
						getInputRef={ref} // Importante para o foco do RHF
						id={inputId}
						value={preserveNumericString ? (value ?? '') : value}
						valueIsNumericString={preserveNumericString ? true : props.valueIsNumericString}
						onBlur={onBlur}
						onValueChange={(values, sourceInfo) => {
							if (preserveNumericString && sourceInfo.source !== 'event') return;
							// Enviamos o floatValue (ex: 10.50) para o estado do formulário
							onChange(preserveNumericString ? values.value : values.floatValue);
						}}
						disabled={disabled}
						// Configurações padrão de moeda brasileira
						decimalScale={2}
						fixedDecimalScale={!preserveNumericString}
						decimalSeparator=','
						thousandSeparator='.'
						prefix='R$ '
						allowNegative={false}
						// Estilização do Shadcn UI
						customInput={Input}
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

export default MoneyInputForm;

import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { PatternFormat, NumberFormatValues } from 'react-number-format';

// 1. Pegamos exatamente o que o seu componente Input aceita
type ShadcnInputProps = ComponentProps<typeof Input>;

// 2. Criamos nossa interface omitindo os campos problemáticos
interface InputFormMaskProps<T extends FieldValues> extends Omit<
	ShadcnInputProps,
	'name' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'onBlur'
> {
	label: string;
	format: string;
	mask?: string;
	error?: string;
	name: Path<T>;
	control: Control<T>;
	// Restringimos o type para o que o PatternFormat aceita (evita erro do "number")
	type?: 'text' | 'tel' | 'password';
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const InputFormMask = <T extends FieldValues>({
	label,
	format,
	mask,
	error,
	control,
	name,
	type = 'text',
	className,
	onBlur: externalOnBlur,
	...props
}: InputFormMaskProps<T>) => {
	const inputId = props.id || name;

	return (
		<Field className={cn('flex flex-col gap-1', className)}>
			<Label htmlFor={inputId} className='text-xs font-medium'>
				{label} {props.required && <span className='text-destructive'>*</span>}
			</Label>

			<Controller
				name={name}
				control={control}
				render={({ field: { onChange, onBlur: rhfOnBlur, value, ref } }) => {
					// SOLUÇÃO PARA O ERRO DE TIPO (readonly string[]):
					// Forçamos o valor a ser string ou number, que é o que o PatternFormat exige.
					const val =
						typeof value === 'string' || typeof value === 'number' ? value : '';

					return (
						<PatternFormat
							{...props} // Espalhamos as props do Shadcn aqui
							id={inputId}
							format={format}
							mask={mask}
							type={type} // "type" restrito no topo evita o erro do HTMLInputTypeAttribute
							customInput={Input}
							getInputRef={ref}
							value={val}
							onValueChange={(values: NumberFormatValues) => {
								// Envia o valor formatado para o React Hook Form
								onChange(values.formattedValue);
							}}
							onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
								rhfOnBlur();
								externalOnBlur?.(e);
							}}
							className={cn(
								'read-only:cursor-not-allowed read-only:bg-zinc-200',
								'placeholder:text-muted-foreground/50',
								error && 'border-destructive',
							)}
						/>
					);
				}}
			/>

			{error && <p className='text-xs text-destructive -mt-1'>{error}</p>}
		</Field>
	);
};

export default InputFormMask;

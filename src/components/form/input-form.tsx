import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { InputHTMLAttributes } from 'react';
import {
	FieldValues,
	Path,
	RegisterOptions,
	UseFormRegister,
} from 'react-hook-form';

interface InputFormProps<
	T extends FieldValues,
> extends InputHTMLAttributes<HTMLInputElement> {
	label: string;
	error?: string;
	name: Path<T>;
	register: UseFormRegister<T>;
	registerOptions?: RegisterOptions<T, Path<T>>;
}

const InputForm = <T extends FieldValues>({
	label,
	error,
	type = 'text',
	register,
	registerOptions,
	name,
	className, // Extraímos aqui para usar no container
	...props
}: InputFormProps<T>) => {
	const inputId = props.id || name || label.replace(/\s+/g, '-').toLowerCase();

	return (
		/* O segredo está aqui: A className de fora (w-20, flex-1, etc.) 
           deve ir para o Field para que o componente todo mude de tamanho.
        */
		<Field className={cn('flex flex-col gap-1', className)}>
			<Label htmlFor={inputId} className='text-xs font-medium'>
				{label} {props.required && <span className='text-destructive'>*</span>}
			</Label>

			<Input
				id={inputId}
				type={type}
				{...register(name, registerOptions)}
				{...props}
				/* Garantimos que o input sempre ocupe 100% do container 
                   que você definiu lá fora. 
                */
				className={cn(
					'w-full read-only:cursor-not-allowed read-only:bg-zinc-100 dark:read-only:bg-zinc-800',
					'placeholder:text-muted-foreground/50',
					error && 'border-destructive',
				)}
			/>

			{error && <p className='text-xs text-destructive -mt-1'>{error}</p>}
		</Field>
	);
};

export default InputForm;

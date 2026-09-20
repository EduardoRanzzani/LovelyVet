'use client';

import { Field } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Certifique-se de ter instalado o componente base do Shadcn
import { cn } from '@/lib/utils';
import { TextareaHTMLAttributes } from 'react';
import {
	FieldValues,
	Path,
	RegisterOptions,
	UseFormRegister,
} from 'react-hook-form';

interface TextareaFormProps<
	T extends FieldValues,
> extends TextareaHTMLAttributes<HTMLTextAreaElement> {
	label: string;
	error?: string;
	name: Path<T>;
	register: UseFormRegister<T>;
	registerOptions?: RegisterOptions<T, Path<T>>;
}

const TextareaForm = <T extends FieldValues>({
	label,
	error,
	register,
	registerOptions,
	name,
	className,
	...props
}: TextareaFormProps<T>) => {
	const textareaId =
		props.id || name || label.replace(/\s+/g, '-').toLowerCase();

	return (
		<Field className={cn('flex min-w-0 flex-col gap-1', className)}>
			<Label htmlFor={textareaId} className='text-xs font-medium'>
				{label} {props.required && <span className='text-destructive'>*</span>}
			</Label>

			<Textarea
				id={textareaId}
				{...register(name, registerOptions)}
				{...props}
				className={cn(
					'w-full min-h-20 resize-y read-only:cursor-not-allowed read-only:bg-zinc-100 dark:read-only:bg-zinc-800',
					error && 'border-destructive',
				)}
			/>

			{error && <p className='text-xs text-destructive -mt-1'>{error}</p>}
		</Field>
	);
};

export default TextareaForm;

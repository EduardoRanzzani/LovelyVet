'use client';

import { cn } from '@/lib/utils';
import { CloudUploadIcon, Loader2Icon, XIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { Button } from '../ui/button';

interface DropzoneFormProps<T extends FieldValues> {
	label: string;
	error?: string;
	name: Path<T>;
	control: Control<T>;
	required?: boolean;
	className?: string;
	description?: string;
	onUpload: (file: File) => Promise<string>;
}

const DropzoneForm = <T extends FieldValues>({
	label,
	error,
	name,
	control,
	required,
	className,
	description = 'PNG, JPG ou WEBP (Max. 5mb)',
	onUpload,
}: DropzoneFormProps<T>) => {
	const [isUploading, setIsUploading] = useState(false);

	return (
		<Controller
			name={name}
			control={control}
			render={({ field: { onChange, value } }) => {
				// Criamos o handler de drop aqui dentro, mas SEM o hook useCallback
				// para evitar o erro de "Hooks inside callbacks"
				const onDrop = async (acceptedFiles: File[]) => {
					if (acceptedFiles.length > 0) {
						setIsUploading(true);
						try {
							const file = acceptedFiles[0];
							const url = await onUpload(file);
							onChange(url);
						} catch (err) {
							console.error('Upload error:', err);
						} finally {
							setIsUploading(false);
						}
					}
				};

				return (
					<div className={cn('flex flex-col w-full gap-1', className)}>
						<label className='text-xs font-medium text-zinc-900 dark:text-zinc-100'>
							{label} {required && <span className='text-red-500'>*</span>}
						</label>

						<DropzoneContent
							value={value}
							onDrop={onDrop}
							isUploading={isUploading}
							onRemove={() => onChange('')}
							error={!!error}
							description={description}
						/>

						{error && <p className='text-xs text-destructive font-medium'>{error}</p>}
					</div>
				);
			}}
		/>
	);
};

// Sub-componente interno para lidar com os hooks do react-dropzone corretamente
interface ContentProps {
	value: string;
	isUploading: boolean;
	error: boolean;
	description: string;
	onDrop: (files: File[]) => void;
	onRemove: () => void;
}

const DropzoneContent = ({ value, isUploading, error, description, onDrop, onRemove }: ContentProps) => {
	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
		multiple: false,
		disabled: isUploading,
	});

	return (
		<div
			{...getRootProps()}
			className={cn(
				'relative flex flex-col items-center justify-center min-h-30 rounded-md border border-dashed transition-all cursor-pointer overflow-hidden',
				'bg-zinc-50/50 dark:bg-zinc-900/20 hover:bg-zinc-100 dark:hover:bg-zinc-800/50',
				isDragActive ? 'border-primary bg-primary/5' : 'border-zinc-300 dark:border-zinc-800',
				error ? 'border-destructive' : '',
				isUploading && 'opacity-60 cursor-not-allowed',
			)}
		>
			<input {...getInputProps()} />

			{isUploading ? (
				<div className='flex flex-col items-center gap-2'>
					<Loader2Icon className='w-6 h-6 animate-spin text-primary' />
					<span className='text-xs text-muted-foreground font-medium'>Enviando...</span>
				</div>
			) : value ? (
				<div className='relative group w-full h-full p-2 flex items-center justify-center'>
					<Image
						src={value.trim()}
						alt='Preview'
						width={200}
						height={200}
						className='max-h-32 w-auto rounded border shadow-sm object-contain bg-white dark:bg-zinc-950'
					/>

					<Button
						type='button'
						variant={'destructive'}
						size={'icon'}
						onClick={(e) => {
							e.stopPropagation();
							onRemove();
						}}
						className='absolute top-3 right-3 p-1.5 rounded-full shadow-lg'
					>
						<XIcon className='w-3.5 h-3.5' />
					</Button>
				</div>
			) : (
				<div className='flex flex-col items-center p-4 text-center'>
					<div className='p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-2'>
						<CloudUploadIcon className='w-5 h-5 text-zinc-500' />
					</div>
					<p className='text-sm font-medium'>
						{isDragActive ? 'Solte a imagem aqui' : 'Arraste ou clique para upload'}
					</p>
					<p className='text-[10px] text-muted-foreground mt-1'>{description}</p>
				</div>
			)}
		</div>
	);
};

export default DropzoneForm;

'use client';

import { updateTutorPetPhoto } from '@/api/actions/pet-photo.actions';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getPetPhotoError, PET_PHOTO_ACCEPT } from '@/lib/pets/pet-photo';
import { LoaderCircleIcon, Trash2Icon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface TutorPetPhotoDialogProps {
	petId: string;
	petName: string;
	photo: string | null;
}

export default function TutorPetPhotoDialog({ petId, petName, photo }: TutorPetPhotoDialogProps) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [selection, setSelection] = useState<{ file: File; previewUrl: string } | null>(null);
	const file = selection?.file ?? null;
	const previewUrl = selection?.previewUrl ?? null;
	const [error, setError] = useState<string | null>(null);
	const [confirmRemove, setConfirmRemove] = useState(false);
	const [busy, setBusy] = useState(false);
	const submitting = useRef(false);

	// Cada URL local pertence somente à seleção atual. Não realiza upload.
	useEffect(() => {
		if (!previewUrl) return;
		return () => URL.revokeObjectURL(previewUrl);
	}, [previewUrl]);

	function changeOpen(nextOpen: boolean) {
		if (submitting.current) return;
		setOpen(nextOpen);
		setSelection(null);
		setError(null);
		setConfirmRemove(false);
	}

	async function submit(operation: 'upload' | 'remove') {
		if (submitting.current || (operation === 'upload' && !file)) return;
		submitting.current = true;
		setBusy(true);
		setError(null);
		try {
			const data = new FormData();
			data.set('petId', petId);
			data.set('operation', operation);
			data.set('expectedPhoto', photo ?? '');
			if (operation === 'upload' && file) data.set('file', file);
			const result = await updateTutorPetPhoto(data);
			if (!result.success) {
				setError(result.error);
				return;
			}
			toast.success(operation === 'remove' ? 'Foto removida com sucesso!' : 'Foto atualizada com sucesso!');
			setOpen(false);
			setSelection(null);
			setConfirmRemove(false);
			router.refresh();
		} catch {
			setError('Não foi possível alterar a foto. Tente novamente.');
		} finally {
			submitting.current = false;
			setBusy(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={changeOpen}>
			<DialogTrigger asChild>
				<button
					type='button'
					aria-label={`Gerenciar foto de ${petName}`}
					className='relative size-40 shrink-0 cursor-pointer rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:size-50'
				>
					<Image
						src={photo || '/pet-placeholder.png'}
						alt={`Foto de ${petName}`}
						fill
						sizes='(min-width: 768px) 200px, 160px'
						draggable={false}
						className='rounded-full border border-zinc-300 object-cover select-none'
					/>
				</button>
			</DialogTrigger>
			<DialogContent
				showCloseButton={!busy}
				className='max-h-[85dvh] overflow-y-auto'
				onEscapeKeyDown={(event) => {
					if (busy) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (busy) event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>Foto de {petName}</DialogTitle>
					<DialogDescription>
						Adicione, substitua ou remova a foto do seu pet. Os demais dados permanecem inalterados.
					</DialogDescription>
				</DialogHeader>
				<div className='relative mx-auto size-32'>
					<Image
						src={previewUrl || photo || '/pet-placeholder.png'}
						alt={previewUrl ? 'Prévia da nova foto do pet' : 'Foto atual do pet'}
						unoptimized={!!previewUrl}
						fill
						sizes='128px'
						className='rounded-full border object-cover'
					/>
				</div>
				{confirmRemove ? (
					<p className='text-sm'>
						Remover a foto atual? Os demais tutores vinculados também verão a imagem padrão.
					</p>
				) : (
					<div className='grid min-w-0 gap-2'>
						<label htmlFor={`pet-photo-${petId}`} className='text-sm font-medium'>
							Selecionar nova foto
						</label>
						<Input
							id={`pet-photo-${petId}`}
							type='file'
							accept={PET_PHOTO_ACCEPT}
							disabled={busy}
							onChange={(event) => {
								const selected = event.target.files?.[0] ?? null;
								const message = selected ? getPetPhotoError(selected) : null;
								setError(message);
								setSelection(
									!message && selected
										? { file: selected, previewUrl: URL.createObjectURL(selected) }
										: null,
								);
								if (message) event.target.value = '';
							}}
						/>
						<p className='text-xs text-muted-foreground'>JPG, PNG ou WebP · até 4 MB.</p>
						{file && <p className='break-all text-sm'>Selecionada: {file.name}</p>}
						{photo && (
							<Button
								type='button'
								variant='destructive'
								disabled={busy}
								onClick={() => {
									setSelection(null);
									setError(null);
									setConfirmRemove(true);
								}}
							>
								<Trash2Icon /> Remover foto atual
							</Button>
						)}
					</div>
				)}
				{error && (
					<p role='alert' className='text-sm text-destructive'>
						{error}
					</p>
				)}
				<DialogFooter>
					<Button
						type='button'
						variant='outline'
						disabled={busy}
						onClick={() => {
							if (confirmRemove) {
								setConfirmRemove(false);
								setError(null);
							} else changeOpen(false);
						}}
					>
						Cancelar
					</Button>
					<Button
						type='button'
						variant={confirmRemove ? 'destructive' : 'default'}
						disabled={busy || (!confirmRemove && !file)}
						onClick={() => void submit(confirmRemove ? 'remove' : 'upload')}
					>
						{busy && <LoaderCircleIcon className='animate-spin' />}
						{busy ? 'Salvando...' : confirmRemove ? 'Confirmar remoção' : 'Salvar foto'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

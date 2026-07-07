import { insertNote } from '@/api/actions/pet-notes.actions';
import {
	CreateNoteSchema,
	createNoteSchema,
} from '@/api/schema/pet-notes.schema';
import TextareaForm from '@/components/form/text-area-form';
import EditorForm from '@/components/form/text-editor-form';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import LoadingDialog from '@/components/ui/loading';
import { zodResolver } from '@hookform/resolvers/zod';
import { BanIcon, MessageCircleIcon, SaveIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface DialogNotesProps {
	petId: string;
}

const DialogNotes = ({ petId }: DialogNotesProps) => {
	const [open, setOpen] = useState<boolean>(false); // Controle manual do estado do Dialog

	const form = useForm<CreateNoteSchema>({
		resolver: zodResolver(createNoteSchema),
		defaultValues: {
			content: '',
		},
	});

	const formSubmit = (data: CreateNoteSchema) => {
		insertNoteAction.execute({
			...data,
			petId: petId,
		});
	};

	const insertNoteAction = useAction(insertNote, {
		onSuccess: () => {
			toast.success('Observação salva com sucesso!');
			setOpen(false);
			form.reset();
		},
		onError: (err) => {
			console.error('Erro ao salvar a observação:', { err });
			toast.error('Ocorreu um erro ao salvar a observação.');
		},
	});

	// Função para lidar com a mudança de estado do Dialog
	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			form.reset(); // Reseta os campos quando o Dialog fecha
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button className='bg-notes hover:bg-notes/80'>
					<MessageCircleIcon />
					Observações
				</Button>
			</DialogTrigger>

			<DialogContent
				showCloseButton={false}
				onInteractOutside={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>Nova Observação</DialogTitle>
					<DialogDescription>
						Descreva abaixo as observações do paciente (não será exibido para os
						tutores)
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(formSubmit)}
						className='flex flex-col gap-2'
					>
						<input type='hidden' name='id' {...form.register} />
						<input type='hidden' name='petId' value={petId} />
						<EditorForm
							control={form.control}
							name='content'
							label='Observações'
							error={form.formState.errors.content?.message}
							placeholder='Digite aqui...'
						/>

						<DialogFooter className='mt-4'>
							<DialogClose asChild className='flex-1'>
								<Button variant={'destructive'}>
									<BanIcon />
									Cancelar
								</Button>
							</DialogClose>

							<Button type='submit' className='flex-1'>
								<SaveIcon />
								Salvar
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>

			{insertNoteAction.isPending && <LoadingDialog />}
		</Dialog>
	);
};

export default DialogNotes;

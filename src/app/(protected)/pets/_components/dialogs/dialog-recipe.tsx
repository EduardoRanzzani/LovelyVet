import {
	createPrescriptionTemplateSchema,
	CreatePrescriptionTemplateSchema,
} from '@/api/schema/prescriptions-template.schema.';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { BanIcon, PenSquareIcon, SaveIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface DialogRecipeProps {
	petId: string;
}

const DialogRecipe = ({ petId }: DialogRecipeProps) => {
	const [open, setOpen] = useState<boolean>(false);

	const form = useForm<CreatePrescriptionTemplateSchema>({
		resolver: zodResolver(createPrescriptionTemplateSchema),
		shouldUnregister: true,
		defaultValues: {},
	});

	const formSubmit = (data: CreatePrescriptionTemplateSchema) => {
		console.log(data);
	};

	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			form.reset();
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button className='bg-prescription hover:bg-prescription/80'>
					<PenSquareIcon />
					Receita
				</Button>
			</DialogTrigger>

			<DialogContent
				className='max-w-lg'
				showCloseButton={false}
				onInteractOutside={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>Nova Receita</DialogTitle>
					<DialogDescription>
						Descrição da receita do paciente
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(formSubmit)}
						className='flex flex-col gap-2'
					>
						<input type='hidden' name='id' />
					</form>
				</Form>

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
			</DialogContent>
		</Dialog>
	);
};

export default DialogRecipe;

import { insertPetWeight } from '@/api/actions/pet-weights.actions';
import {
	createPetWeightSchema,
	CreatePetWeightSchema,
} from '@/api/schema/pet-weight.schema';
import WeightInputForm from '@/components/form/weight-input-form';
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
import { BanIcon, Loader2Icon, SaveIcon, ScaleIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface DialogWeightProps {
	petId: string;
}

const DialogWeight = ({ petId }: DialogWeightProps) => {
	const [open, setOpen] = useState<boolean>(false);

	const form = useForm<CreatePetWeightSchema>({
		resolver: zodResolver(createPetWeightSchema),
		shouldUnregister: true,
		defaultValues: {
			weightInGrams: 0,
		},
	});

	const formSubmit = (data: CreatePetWeightSchema) => {
		insertPetWeightAction.execute({
			...data,
			petId: petId,
		});
	};

	const insertPetWeightAction = useAction(insertPetWeight, {
		onSuccess: () => {
			toast.success('Peso salvo com sucesso!');
			setOpen(false);
			form.reset();
		},
		onError: (err) => {
			console.error('Erro ao salvar o peso:', { err });
			toast.error('Ocorreu um erro ao salvar o peso.');
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
				<Button className='bg-weight hover:bg-weight/80'>
					<ScaleIcon />
					Peso
				</Button>
			</DialogTrigger>

			<DialogContent
				onInteractOutside={(e) => e.preventDefault()}
				showCloseButton={false}
			>
				<DialogHeader>
					<DialogTitle>Novo Peso</DialogTitle>
					<DialogDescription>Informe o peso do paciente</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						id='weightForm'
						onSubmit={form.handleSubmit(formSubmit)}
						className='flex flex-col gap-2'
					>
						<input type='hidden' name='id' {...form.register} />
						<input type='hidden' name='petId' value={petId} />

						<WeightInputForm
							label='Peso:'
							control={form.control}
							name='weightInGrams'
							error={form.formState.errors.weightInGrams?.message}
						/>
					</form>
				</Form>

				{insertPetWeightAction.isPending && <LoadingDialog />}

				<DialogFooter className='mt-4'>
					<DialogClose asChild>
						<Button
							type='button'
							variant={'destructive'}
							onClick={() => {
								if (!insertPetWeightAction.isPending) form.reset();
							}}
							className='flex-1'
						>
							<BanIcon />
							Cancelar
						</Button>
					</DialogClose>

					<Button
						type='submit'
						disabled={insertPetWeightAction.isPending}
						form='weightForm'
						className='flex-1'
					>
						{insertPetWeightAction.isPending ? (
							<Loader2Icon className='h-5 w-5 animate-spin' />
						) : (
							<>
								<SaveIcon />
								Salvar
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default DialogWeight;

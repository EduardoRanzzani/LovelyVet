import { upsertBreed } from '@/api/actions/breeds.actions';
import {
	BreedsWithRelations,
	createBreedSchema,
	CreateBreedSchema,
} from '@/api/schema/breeds.schema';
import { Species } from '@/api/schema/species.schema';
import InputForm from '@/components/form/input-form';
import SelectForm from '@/components/form/select-form';
import { Button } from '@/components/ui/button';
import {
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import LoadingDialog from '@/components/ui/loading';
import { zodResolver } from '@hookform/resolvers/zod';
import { BanIcon, Loader2Icon, SaveIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface BreedFormClientProps {
	breed?: BreedsWithRelations;
	species: Species[];
	onSuccess?: () => void;
}

const BreedFormClient = ({
	breed,
	species,
	onSuccess,
}: BreedFormClientProps) => {
	const form = useForm<CreateBreedSchema>({
		resolver: zodResolver(createBreedSchema),
		shouldUnregister: true,
		defaultValues: {
			name: breed?.name || '',
			specieId: breed?.specieId || '',
		},
	});

	const formSubmit = (data: CreateBreedSchema) => {
		upsertBreedAction.execute({
			...data,
			id: breed?.id,
		});
	};

	const upsertBreedAction = useAction(upsertBreed, {
		onSuccess: () => {
			onSuccess?.();
			toast.success('Raça salva com sucesso!');
			form.reset();
		},
		onError: (err) => {
			console.error({ err });
			toast.error('Ocorreu um erro ao salvar a raça!');
		},
	});

	return (
		<DialogContent
			onInteractOutside={(e) => e.preventDefault()}
			showCloseButton={false}
		>
			<DialogHeader>
				<DialogTitle>{breed ? 'Atualizar Raça' : 'Cadastrar Raça'}</DialogTitle>
				<DialogDescription>
					{breed
						? 'Atualize as informações da raça selecionada'
						: 'Adicione uma nova raça ao sistema'}
				</DialogDescription>
			</DialogHeader>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(formSubmit)}>
					<div className='flex max-h-[calc(100dvh-12rem)] min-w-0 flex-col gap-2 overflow-y-auto px-1'>
						<SelectForm
							label='Espécie:'
							name='specieId'
							control={form.control}
							error={form.formState.errors.specieId?.message}
							options={species.map((specie) => ({
								value: specie.id,
								label: specie.name,
								key: specie.id,
							}))}
						/>

						<InputForm
							label='Descrição:'
							register={form.register}
							name='name'
							error={form.formState.errors.name?.message}
						/>
					</div>

					{upsertBreedAction.isPending && <LoadingDialog />}

					<DialogFooter className='mt-4'>
						<DialogClose asChild>
							<Button
								type='button'
								variant={'destructive'}
								onClick={() => {
									if (!upsertBreedAction.isPending) form.reset();
								}}
								className='flex-1'
							>
								<BanIcon />
								Cancelar
							</Button>
						</DialogClose>

						<Button
							type='submit'
							disabled={upsertBreedAction.isPending}
							className='flex-1'
						>
							{upsertBreedAction.isPending ? (
								<Loader2Icon className='h-5 w-5 animate-spin' />
							) : (
								<>
									<SaveIcon />
									Salvar
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</Form>
		</DialogContent>
	);
};

export default BreedFormClient;

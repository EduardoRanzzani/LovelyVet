'use client';
import { upsertPet } from '@/api/actions/pets.actions';
import { uploadImageAction } from '@/api/actions/upload-cloudinary';
import { BreedsWithRelations } from '@/api/schema/breeds.schema';
import { CustomersWithRelations } from '@/api/schema/customers.schema';
import {
	createPetWithTutorAndBreedSchema,
	CreatePetWithTutorAndBreedSchema,
	PetsWithRelations,
} from '@/api/schema/pets.schema';
import { Species } from '@/api/schema/species.schema';
import DatePickerForm from '@/components/form/datepicker-form';
import DropzoneForm from '@/components/form/image-dropzone-form';
import InputForm from '@/components/form/input-form';
import SelectForm from '@/components/form/select-form';
import WeightInputForm from '@/components/form/weight-input-form';
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
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface PetFormClientProps {
	pet?: PetsWithRelations;
	species: Species[];
	breeds: BreedsWithRelations[];
	customers: CustomersWithRelations[];
	onSuccess?: () => void;
}

const PetFormClient = ({
	pet,
	species,
	breeds,
	customers,
	onSuccess,
}: PetFormClientProps) => {
	const form = useForm<CreatePetWithTutorAndBreedSchema>({
		resolver: zodResolver(createPetWithTutorAndBreedSchema),
		shouldUnregister: true,
		defaultValues: {
			name: pet?.name ?? '',
			birthDate: pet ? new Date(pet.birthDate + 'T12:00:00') : new Date(),
			specieId: pet?.breed.specieId ?? '',
			breedId: pet?.breedId ?? '',
			customerIds: pet?.petTutors?.map((pt) => pt.tutor.id) ?? [],
			color: pet?.color ?? '',
			gender: pet?.gender ?? 'female',
			sterile: pet?.sterile ?? false,
			status: pet?.status ?? 'alive',
			weightInGrams: pet?.weightInGrams ?? 0,
			photo: pet?.photo ?? '',
		},
	});

	// Observa a espécie selecionada
	const selectedSpecieId = form.watch('specieId');

	// Deriva a lista de raças (sem useEffect!)
	const filteredBreeds = useMemo(() => {
		const currentSpecieId = selectedSpecieId || pet?.breed.specieId;
		if (!currentSpecieId) return [];
		return breeds.filter((breed) => breed.specieId === currentSpecieId);
	}, [breeds, selectedSpecieId, pet]);

	useEffect(() => {
		if (pet?.breedId && filteredBreeds.length > 0) {
			// Garante que o valor da raça permaneça o do pet ao abrir para edição
			const isValidBreed = filteredBreeds.some((b) => b.id === pet.breedId);
			if (isValidBreed && !form.getValues('breedId')) {
				form.setValue('breedId', pet.breedId);
			}
		}
	}, [filteredBreeds, pet, form]);

	const handleSpeciesChange = () => {
		// Se mudou a espécie manualmente, limpa a raça
		form.setValue('breedId', '');
	};

	const handlePhotoUpload = async (file: File): Promise<string> => {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('folder', 'pets');

		try {
			const url = await uploadImageAction(formData);
			return url;
		} catch (error) {
			toast.error('Erro ao anexar a imagem!');
			throw error;
		}
	};

	const formSubmit = (data: CreatePetWithTutorAndBreedSchema) => {
		upsertPetAction.execute({
			...data,
			id: pet?.id,
			status: 'alive',
		});
	};

	const upsertPetAction = useAction(upsertPet, {
		onSuccess: () => {
			onSuccess?.();
			toast.success('Pet salvo com sucesso!');
			form.reset();
		},
		onError: (err) => {
			console.error({ err });
			toast.error('Ocorreu um erro ao salvar o pet!');
		},
	});

	return (
		<DialogContent
			onInteractOutside={(e) => e.preventDefault()}
			showCloseButton={false}
		>
			<DialogHeader>
				<DialogTitle>{pet ? 'Atualizar Pet' : 'Cadastrar Pet'}</DialogTitle>
				<DialogDescription>
					{pet
						? 'Atualize as informações do pet selecionado'
						: 'Adicione um novo pet ao sistema'}
				</DialogDescription>
			</DialogHeader>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(formSubmit)}>
					<div className='flex max-h-[calc(100dvh-12rem)] min-w-0 flex-col gap-2 overflow-y-auto px-1'>
						<input
							type='text'
							{...form.register('status')}
							className='hidden'
						/>

						<div className='w-full flex flex-col lg:flex-row gap-4'>
							<InputForm
								label='Nome:'
								register={form.register}
								name='name'
								error={form.formState.errors.name?.message}
							/>

							<DatePickerForm
								label='Data de Nascimento:'
								control={form.control}
								name='birthDate'
								error={form.formState.errors.birthDate?.message}
							/>
						</div>

						<DropzoneForm
							label='Foto:'
							name='photo'
							control={form.control}
							onUpload={handlePhotoUpload}
							error={form.formState.errors.photo?.message}
						/>

						<SelectForm
							label='Tutor(es):'
							control={form.control}
							name='customerIds'
							multiple
							maxVisible={3}
							options={customers.map((customer) => ({
								value: customer.id,
								label: customer.user.name,
							}))}
							error={form.formState.errors.customerIds?.message}
						/>

						<div className='w-full flex flex-row gap-4'>
							<SelectForm
								label='Espécie:'
								control={form.control}
								name='specieId'
								options={species.map((specie) => ({
									value: specie.id,
									label: specie.name,
								}))}
								onSelect={() => handleSpeciesChange()}
								error={form.formState.errors.specieId?.message}
							/>

							<SelectForm
								label='Raça:'
								control={form.control}
								name='breedId'
								options={filteredBreeds.map((breed) => ({
									value: breed.id,
									label: breed.name,
								}))}
								error={form.formState.errors.breedId?.message}
							/>
						</div>

						<div className='w-full flex flex-row gap-4'>
							<InputForm
								label='Pelagem:'
								register={form.register}
								name='color'
								error={form.formState.errors.color?.message}
							/>

							<SelectForm
								label='Gênero'
								control={form.control}
								name='gender'
								options={[
									{
										value: 'male',
										label: 'Macho',
									},
									{
										value: 'female',
										label: 'Fêmea',
									},
								]}
								error={form.formState.errors.gender?.message}
							/>
						</div>

						<div className='w-full flex flex-row gap-4'>
							<SelectForm
								label='Castrado?'
								control={form.control}
								name='sterile'
								options={[
									{
										value: true,
										label: 'Sim',
									},
									{
										value: false,
										label: 'Não',
									},
								]}
								error={form.formState.errors.sterile?.message}
							/>

							<WeightInputForm
								label='Peso:'
								control={form.control}
								name='weightInGrams'
								error={form.formState.errors.weightInGrams?.message}
							/>
						</div>
					</div>

					{upsertPetAction.isPending && <LoadingDialog />}

					<DialogFooter className='mt-4'>
						<DialogClose asChild>
							<Button
								type='button'
								variant={'destructive'}
								onClick={() => {
									if (!upsertPetAction.isPending) form.reset();
								}}
								className='flex-1'
							>
								<BanIcon />
								Cancelar
							</Button>
						</DialogClose>

						<Button
							type='submit'
							disabled={upsertPetAction.isPending}
							className='flex-1'
						>
							{upsertPetAction.isPending ? (
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

export default PetFormClient;

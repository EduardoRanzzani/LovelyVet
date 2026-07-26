'use client';
import { createPrescription } from '@/api/actions/prescriptions.actions';
import { REGINA_DOCTOR_ID } from '@/api/config/consts';
import { DoctorsWithRelations } from '@/api/schema/doctors.schema';
import { PetsWithRelations } from '@/api/schema/pets.schema';
import { PrescriptionItemsWithRelations } from '@/api/schema/prescriptions-items.schema';
import {
	CreatePrescriptionSchema,
	PrescriptionsWithRelations,
} from '@/api/schema/prescriptions.schema';
import SelectForm from '@/components/form/select-form';
import TextEditorForm from '@/components/form/text-editor-form';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { zodResolver } from '@hookform/resolvers/zod';
import { BanIcon, Loader2Icon, SaveIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

const createPrescriptionFormSchema = z.object({
	petId: z.uuid().nonempty({ message: 'Pet é obrigatório' }),
	doctorId: z
		.uuid({ message: 'Veterinário é obrigatório' })
		.nonempty({ message: 'Veterinário é obrigatório' }),
	prescriptionItemsIds: z.array(z.uuid()).min(1, {
		message: 'Selecione ao menos um item de receita',
	}),
	items: z.array(
		z.object({
			id: z.uuid(),
			name: z.string(),
			pharmacy: z.string(),
			quantity: z.string(),
			orientations: z.string(),
		}),
	),
});

type CreatePrescriptionFormSchema = z.infer<
	typeof createPrescriptionFormSchema
>;

interface PrescriptionFormClientProps {
	prescription?: PrescriptionsWithRelations;
	prescriptionItems: PrescriptionItemsWithRelations[];
	doctors: DoctorsWithRelations[];
	pets: PetsWithRelations[];
	onSuccess: () => void;
}

const PrescriptionFormClient = ({
	prescription,
	prescriptionItems,
	doctors,
	pets,
	onSuccess,
}: PrescriptionFormClientProps) => {
	const [open, setOpen] = useState<boolean>(false);
	const form = useForm<CreatePrescriptionFormSchema>({
		resolver: zodResolver(createPrescriptionFormSchema),
		shouldUnregister: false,
		defaultValues: {
			doctorId: prescription?.doctorId || REGINA_DOCTOR_ID,
			petId: prescription?.petId || '',
			items: [],
		},
	});

	const { fields, replace } = useFieldArray({
		control: form.control,
		name: 'items',
	});

	const formSubmit = (data: CreatePrescriptionFormSchema) => {
		const payload = {
			petId: data.petId,
			doctorId: data.doctorId,
			prescriptionItemsIds: data.prescriptionItemsIds,
			items: data.items.map((item) => ({
				prescriptionItemId: item.id,
				orientations: item.orientations,
			})),
		};

		createPrescriptionAction.execute(payload as CreatePrescriptionSchema);
	};

	const createPrescriptionAction = useAction(createPrescription, {
		onSuccess: () => {
			toast.success('Receita criada com sucesso!');
			form.reset();
			setOpen(false);
		},
		onError: (err) => {
			console.error({ err });
			toast.error('Ocorreu um erro ao criar a receita!');
		},
	});

	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			form.reset();
		}
	};

	return (
		<DialogContent
			showCloseButton={false}
			onInteractOutside={(e) => e.preventDefault()}
		>
			<DialogHeader>
				<DialogTitle>Nova Receita</DialogTitle>
				<DialogDescription>
					Selecione um veterinário e os itens da receita
				</DialogDescription>
			</DialogHeader>

			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(formSubmit)}
					className='flex flex-col gap-4'
					id='prescriptionForm'
				>
					<Tabs defaultValue='form' className='w-full'>
						<TabsList className='grid w-full grid-cols-2'>
							<TabsTrigger value='form'>Formulário</TabsTrigger>
							<TabsTrigger value='preview'>Prévia</TabsTrigger>
						</TabsList>

						<TabsContent value='form' className='space-y-4 pt-4'>
							<SelectForm
								label='Veterinário'
								name='doctorId'
								options={doctors.map((doctor) => ({
									value: doctor.id,
									label: doctor.user?.name || 'Veterinário',
								}))}
								control={form.control}
								error={form.formState.errors.doctorId?.message}
								placeholder='Selecione um veterinário'
							/>

							<SelectForm
								label='Pet'
								name='petId'
								options={pets.map((pet) => ({
									value: pet.id,
									label:
										pet.name + ' (' + pet.petTutors[0]?.tutor.user.name + ')',
								}))}
								control={form.control}
								error={form.formState.errors.petId?.message}
								placeholder='Selecione um pet'
							/>

							<SelectForm
								label='Itens da Receita'
								name='prescriptionItemsIds'
								control={form.control}
								multiple
								options={prescriptionItems.map((item) => ({
									value: item.id,
									label: `${item.name} (${item.pharmacy}) - ${item.quantity}`,
								}))}
								error={form.formState.errors.prescriptionItemsIds?.message}
								placeholder='Selecione os itens da receita'
								maxVisible={3}
								onSelect={(values) => {
									const selectedIds = Array.isArray(values) ? values : [];
									const currentItems = form.getValues('items');

									const updatedItems = selectedIds.map((id) => {
										// Se o item já estava selecionado, mantemos a versão atual (que pode ter edições)
										const existing = currentItems.find(
											(item) => item.id === id,
										);
										if (existing) return existing;

										// Se for um novo item, buscamos os dados originais
										const original = prescriptionItems.find(
											(item) => item.id === id,
										);
										return {
											id: original?.id || '',
											name: original?.name || '',
											pharmacy: original?.pharmacy || '',
											quantity: original?.quantity || '',
											orientations: original?.orientations || '',
										};
									});
									replace(updatedItems);
								}}
								className='flex-1'
							/>
						</TabsContent>

						<TabsContent value='preview' className='space-y-4 pt-4'>
							<div className='border rounded-lg p-4 bg-white max-h-100 overflow-y-auto'>
								{fields.length > 0 ? (
									<div className='space-y-6'>
										{fields.map((field, index) => (
											<div
												key={field.id}
												className='pb-4 border-b last:border-b-0'
											>
												<div className='flex items-end gap-2 mb-2'>
													<span className='font-bold'>{field.name}</span>
													<div className='flex-1 border-b border-gray-300' />
													<span className='text-sm text-gray-600'>
														({field.pharmacy})
													</span>
													<div className='flex-1 border-b border-gray-300' />
													<span className='font-bold text-sm'>
														{field.quantity}
													</span>
												</div>
												<TextEditorForm
													name={`items.${index}.orientations`}
													control={form.control}
													label=''
												/>
											</div>
										))}
									</div>
								) : (
									<p className='text-sm text-muted-foreground text-center py-8'>
										Selecione itens para ver a prévia
									</p>
								)}
							</div>
						</TabsContent>
					</Tabs>
				</form>
			</Form>

			{createPrescriptionAction.isPending && <LoadingDialog />}

			<DialogFooter className='mt-4'>
				<DialogClose asChild className='flex-1'>
					<Button
						variant={'destructive'}
						disabled={createPrescriptionAction.isPending}
					>
						<BanIcon />
						Cancelar
					</Button>
				</DialogClose>

				<Button
					type='submit'
					form='prescriptionForm'
					disabled={createPrescriptionAction.isPending}
					className='flex-1'
				>
					{createPrescriptionAction.isPending ? (
						<Loader2Icon className='h-5 w-5 animate-spin' />
					) : (
						<>
							<SaveIcon />
							Salvar Receita
						</>
					)}
				</Button>
			</DialogFooter>
		</DialogContent>
	);
};

export default PrescriptionFormClient;

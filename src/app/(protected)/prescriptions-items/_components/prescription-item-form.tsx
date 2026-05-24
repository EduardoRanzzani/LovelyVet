import { upsertPrescriptionItems } from '@/api/actions/prescriptions-items.actions';
import {
	createPrescriptionItemSchema,
	CreatePrescriptionItemSchema,
	PrescriptionItemsWithRelations,
} from '@/api/schema/prescriptions-items.schema';
import InputForm from '@/components/form/input-form';
import SelectForm from '@/components/form/select-form';
import EditorForm from '@/components/form/text-editor-form';
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
interface PrescriptionItemFormClientProps {
	prescriptionItem?: PrescriptionItemsWithRelations;
	onSuccess?: () => void;
}

const PrescriptionItemFormClient = ({
	prescriptionItem,
	onSuccess,
}: PrescriptionItemFormClientProps) => {
	const form = useForm<CreatePrescriptionItemSchema>({
		resolver: zodResolver(createPrescriptionItemSchema),
		shouldUnregister: true,
		defaultValues: {
			name: prescriptionItem?.name || '',
			pharmacy: prescriptionItem?.pharmacy || '',
			quantity: prescriptionItem?.quantity || '',
			orientations: prescriptionItem?.orientations || '',
		},
	});

	const formSubmit = (data: CreatePrescriptionItemSchema) => {
		upsertPrescriptionItemAction.execute({
			...data,
			id: prescriptionItem?.id,
		});
	};

	const upsertPrescriptionItemAction = useAction(upsertPrescriptionItems, {
		onSuccess: () => {
			onSuccess?.();
			toast.success('Item de receita salva com sucesso!');
			form.reset();
		},
		onError: (err) => {
			console.error({ err });
			toast.error('Ocorreu um erro ao salvar o item de receita!');
		},
	});

	return (
		<DialogContent
			onInteractOutside={(e) => e.preventDefault()}
			showCloseButton={false}
		>
			<DialogHeader>
				<DialogTitle>
					{prescriptionItem ? 'Atualizar Item' : 'Cadastrar Item'}
				</DialogTitle>
				<DialogDescription>
					{prescriptionItem
						? 'Atualize as informações do item selecionado'
						: 'Adicione um novo item de receita ao sistema'}
				</DialogDescription>
			</DialogHeader>

			<Form {...form}>
				<form
					id='prescriptionItemForm'
					onSubmit={form.handleSubmit(formSubmit)}
					className='flex flex-col gap-2'
				>
					<input type='hidden' name='id' {...form.register} />

					<InputForm
						register={form.register}
						name='name'
						label='Nome da Medicação'
						error={form.formState.errors.name?.message}
					/>

					<span className='flex flex-col lg:flex-row gap-2 lg:gap-4'>
						<SelectForm
							control={form.control}
							name='pharmacy'
							label='Farmácia'
							options={[
								{
									label: 'Humana',
									value: 'Farmácia Humana',
								},
								{
									label: 'Veterinária',
									value: 'Farmácia Veterinaria',
								},
							]}
							error={form.formState.errors.pharmacy?.message}
						/>

						<InputForm
							register={form.register}
							name='quantity'
							label='Quantidade'
							error={form.formState.errors.quantity?.message}
						/>
					</span>

					<EditorForm
						control={form.control}
						name='orientations'
						label='Observações'
						error={form.formState.errors.orientations?.message}
					/>
				</form>
			</Form>

			{upsertPrescriptionItemAction.isPending && <LoadingDialog />}

			<DialogFooter className='mt-4'>
				<DialogClose asChild>
					<Button
						type='button'
						variant={'destructive'}
						onClick={() => {
							if (!upsertPrescriptionItemAction.isPending) form.reset();
						}}
						className='flex-1'
					>
						<BanIcon />
						Cancelar
					</Button>
				</DialogClose>

				<Button
					type='submit'
					disabled={upsertPrescriptionItemAction.isPending}
					form='prescriptionItemForm'
					className='flex-1'
				>
					{upsertPrescriptionItemAction.isPending ? (
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
	);
};

export default PrescriptionItemFormClient;

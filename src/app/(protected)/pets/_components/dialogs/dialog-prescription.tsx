'use client';

import { getPrescriptionsItems } from '@/api/actions/prescriptions-items.actions';
import { DoctorsWithRelations } from '@/api/schema/doctors.schema';
import { PrescriptionItemsWithRelations } from '@/api/schema/prescriptions-items.schema';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { BanIcon, PenSquareIcon, SaveIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';

const createPrescriptionFormSchema = z.object({
	doctorId: z
		.uuid({ message: 'Veterinário é obrigatório' })
		.nonempty({ message: 'Veterinário é obrigatório' }),
	prescriptionItemsIds: z.array(z.uuid()).min(1, {
		message: 'Selecione ao menos um item de receita',
	}),
});

type CreatePrescriptionFormSchema = z.infer<
	typeof createPrescriptionFormSchema
>;

interface DialogPrescriptionProps {
	petId: string;
	doctors: DoctorsWithRelations[];
}

const DialogPrescription = ({ petId, doctors }: DialogPrescriptionProps) => {
	const [open, setOpen] = useState<boolean>(false);
	const [prescriptionItems, setPrescriptionItems] = useState<
		PrescriptionItemsWithRelations[]
	>([]);
	const [selectedItems, setSelectedItems] = useState<
		PrescriptionItemsWithRelations[]
	>([]);

	const form = useForm<CreatePrescriptionFormSchema>({
		resolver: zodResolver(createPrescriptionFormSchema),
		shouldUnregister: true,
		defaultValues: {
			doctorId: '',
			prescriptionItemsIds: [],
		},
	});

	useEffect(() => {
		const loadPrescriptionItems = async () => {
			const items = await getPrescriptionsItems();
			setPrescriptionItems(items);
		};
		loadPrescriptionItems();
	}, []);

	const formSubmit = (data: CreatePrescriptionFormSchema) => {};

	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			form.reset();
			setSelectedItems([]);
		}
	};

	const handleItemToggle = (itemId: string) => {
		const currentIds = form.getValues('prescriptionItemsIds') ?? [];
		const newIds = currentIds.includes(itemId)
			? currentIds.filter((id) => id !== itemId)
			: [...currentIds, itemId];

		form.setValue('prescriptionItemsIds', newIds);

		const newSelectedItems = prescriptionItems.filter((item) =>
			newIds.includes(item.id),
		);
		setSelectedItems(newSelectedItems);
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
				showCloseButton={false}
				onInteractOutside={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>Nova Receita</DialogTitle>
					<DialogDescription>
						Selecione um veterinário e os itens da receita
					</DialogDescription>
				</DialogHeader>

				{/* {createPrescriptionAction.isPending && <LoadingDialog />} */}

				<DialogFooter className='mt-4'>
					<DialogClose asChild className='flex-1'>
						<Button
							variant={'destructive'}
							// disabled={createPrescriptionAction.isPending}
						>
							<BanIcon />
							Cancelar
						</Button>
					</DialogClose>

					<Button
						type='submit'
						form='prescriptionForm'
						// disabled={createPrescriptionAction.isPending}
						className='flex-1'
					>
						{/* {createPrescriptionAction.isPending ? ( */}
						{/* <Loader2Icon className='h-5 w-5 animate-spin' /> */}
						{/* ) : ( */}
						{/* <> */}
						<SaveIcon />
						Salvar Receita
						{/* </> */}
						{/* )} */}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default DialogPrescription;

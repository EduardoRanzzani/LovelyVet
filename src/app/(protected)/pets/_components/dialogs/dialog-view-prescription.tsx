'use client';

import { getPrescriptionById } from '@/api/actions/prescriptions.actions';
import { PetsWithRelations } from '@/api/schema/pets.schema';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import LoadingDialog from '@/components/ui/loading';
import { FileIcon } from 'lucide-react';
import { useState } from 'react';
import PrescriptionViewerClient from '../prescription-viewer';

interface PrescriptionItem {
	id: string;
	issuedAt: Date;
	doctor: {
		user: {
			name: string;
		};
	};
}

interface PrescriptionData {
	id: string;
	content: string;
	issuedAt: string | Date;
	doctor?: {
		user?: {
			name?: string;
		};
	};
}

interface DialogViewPrescriptionProps {
	prescription: PrescriptionItem;
	pet: PetsWithRelations;
}

const DialogViewPrescription = ({
	prescription,
	pet,
}: DialogViewPrescriptionProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [prescriptionData, setPrescriptionData] = useState<PrescriptionData>();

	const handleOpenChange = async (open: boolean) => {
		setIsOpen(open);
		if (open && !prescriptionData) {
			setIsLoading(true);
			try {
				const data = await getPrescriptionById(prescription.id);
				setPrescriptionData(data);
			} catch (error) {
				console.error('Erro ao carregar receita:', error);
			} finally {
				setIsLoading(false);
			}
		}
	};

	return (
		<>
			<Dialog open={isOpen} onOpenChange={handleOpenChange}>
				<DialogTrigger asChild>
					<button className='flex items-center gap-2 text-sm hover:text-blue-600 cursor-pointer'>
						<FileIcon className='w-4 h-4' />
						Ver Receita
					</button>
				</DialogTrigger>

				<DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto p-0'>
					<DialogHeader className='p-4 border-b'>
						<DialogTitle>
							Receita -{' '}
							{prescription.issuedAt.toLocaleDateString('pt-BR', {
								day: '2-digit',
								month: '2-digit',
								year: 'numeric',
							})}
						</DialogTitle>
					</DialogHeader>

					{isLoading ? (
						<div className='flex items-center justify-center h-96'>
							<LoadingDialog />
						</div>
					) : prescriptionData ? (
						<div className='p-0'>
							<PrescriptionViewerClient
								pet={pet}
								prescriptionContent={prescriptionData.content}
								doctorName={prescriptionData.doctor?.user?.name || 'N/A'}
								issuedAt={new Date(prescriptionData.issuedAt)}
							/>
						</div>
					) : (
						<div className='flex items-center justify-center h-96'>
							<p className='text-muted-foreground'>
								Erro ao carregar a receita
							</p>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{isLoading && <LoadingDialog />}
		</>
	);
};

export default DialogViewPrescription;

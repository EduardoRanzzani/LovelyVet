'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileTextIcon, PrinterIcon, StethoscopeIcon } from 'lucide-react';
import PrescriptionBuilder, {
	type PrescriptionDraftItem,
} from './prescription-builder';
import PrescriptionPreview, {
	type PrescriptionPatientData,
} from './prescription-preview';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { savePrescriptionDocument } from '@/api/actions/prescriptions.actions';
import { REGINA_DOCTOR_ID } from '@/api/config/consts';
import { SaveIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

interface ClinicalDocumentBuilderProps {
	petId: string;
	patient: PrescriptionPatientData;
	tutors: ClinicalDocumentTutor[];
}

export interface ClinicalDocumentTutor {
	id: string;
	name: string;
}

export default function ClinicalDocumentBuilder({
	petId,
	patient,
	tutors,
}: ClinicalDocumentBuilderProps) {
	const [prescriptionItems, setPrescriptionItems] = useState<
		PrescriptionDraftItem[]
	>([]);
	const [administrationRoute, setAdministrationRoute] = useState('');
	const [selectedTutorId, setSelectedTutorId] = useState(tutors[0]?.id ?? '');
	const selectedTutor = tutors.find((tutor) => tutor.id === selectedTutorId);
	const selectedTutorName = selectedTutor?.name ?? '-';

	const canPrintPrescription =
		prescriptionItems.length > 0 &&
		prescriptionItems.every(
			(item) =>
				item.name.trim() && item.quantity.trim() && item.orientations.trim(),
		);

	const canSavePrescription =
		Boolean(selectedTutorId) &&
		prescriptionItems.length > 0 &&
		prescriptionItems.every(
			(item) =>
				item.name.trim() && item.quantity.trim() && item.orientations.trim(),
		);

	const prescriptionPrintRef = useRef<HTMLDivElement>(null);

	const handlePrintPrescription = useReactToPrint({
		contentRef: prescriptionPrintRef,
		documentTitle: `Receita - ${patient.name}`,
		pageStyle: `
		@page {
			size: A4 portrait;
			margin: 0;
		}

		@media print {
			html,
			body {
				margin: 0 !important;
				padding: 0 !important;
			}

			.prescription-print-area {
				width: 210mm !important;
				height: 297mm !important;
				max-width: none !important;
				margin: 0 !important;
				box-shadow: none !important;

				-webkit-print-color-adjust: exact !important;
				print-color-adjust: exact !important;
			}
		}
	`,
	});

	const savePrescriptionAction = useAction(savePrescriptionDocument, {
		onSuccess: () => {
			toast.success('Receita salva com sucesso!');
		},

		onError: ({ error }) => {
			console.error(error);
			toast.error('Não foi possível salvar a receita.');
		},
	});

	const handleSavePrescription = () => {
		if (!canSavePrescription) {
			return;
		}
		savePrescriptionAction.execute({
			petId,
			tutorId: selectedTutorId,
			doctorId: REGINA_DOCTOR_ID,
			administrationRoute,
			items: prescriptionItems,
		});
	};

	return (
		<div className='mt-6'>
			<div className='mb-6 max-w-md space-y-2'>
				<p className='text-sm font-medium'>
					Tutor que será exibido no documento
				</p>

				<Select value={selectedTutorId} onValueChange={setSelectedTutorId}>
					<SelectTrigger className='w-full'>
						<SelectValue placeholder='Selecione o tutor' />
					</SelectTrigger>

					<SelectContent>
						{tutors.map((tutor) => (
							<SelectItem key={tutor.id} value={tutor.id}>
								{tutor.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<Tabs defaultValue='prescription'>
				<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
					<TabsList>
						<TabsTrigger value='prescription'>
							<FileTextIcon className='size-4' />
							Receita
						</TabsTrigger>

						<TabsTrigger value='referral'>
							<StethoscopeIcon className='size-4' />
							Encaminhamento
						</TabsTrigger>
					</TabsList>

					<Button
						type='button'
						onClick={handleSavePrescription}
						disabled={
							!canSavePrescription || savePrescriptionAction.isExecuting
						}
					>
						<SaveIcon className='size-4' />
						{savePrescriptionAction.isExecuting ? 'Salvando...' : 'Salvar'}
					</Button>

					<Button
						type='button'
						variant='outline'
						onClick={handlePrintPrescription}
						disabled={!canPrintPrescription}
					>
						<PrinterIcon className='size-4' />
						Imprimir
					</Button>
				</div>

				<TabsContent value='prescription' className='mt-6'>
					<div className='rounded-xl border bg-card p-6'>
						<div className='mb-6'>
							<h2 className='text-lg font-semibold'>Receita</h2>

							<p className='text-sm text-muted-foreground'>
								Adicione os medicamentos e as orientações da receita.
							</p>
						</div>

						<div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(500px,0.9fr)]'>
							<div className='min-w-0'>
								<PrescriptionBuilder
									onItemsChange={setPrescriptionItems}
									onAdministrationRouteChange={setAdministrationRoute}
								/>
							</div>

							<div className='min-w-0'>
								<div className='sticky top-6'>
									<div className='mb-3'>
										<h3 className='font-semibold'>Prévia</h3>

										<p className='text-sm text-muted-foreground'>
											Visualização aproximada da impressão em A4.
										</p>
									</div>

									<PrescriptionPreview
										printRef={prescriptionPrintRef}
										patient={patient}
										tutorName={selectedTutorName}
										items={prescriptionItems}
										administrationRoute={administrationRoute}
									/>
								</div>
							</div>
						</div>
					</div>
				</TabsContent>

				<TabsContent value='referral' className='mt-6'>
					<div className='rounded-xl border bg-card p-6'>
						<div className='mb-6'>
							<h2 className='text-lg font-semibold'>Encaminhamento</h2>

							<p className='text-sm text-muted-foreground'>
								Preencha as informações necessárias para o encaminhamento.
							</p>
						</div>

						<div className='flex min-h-64 items-center justify-center rounded-lg border border-dashed'>
							<p className='text-sm text-muted-foreground'>
								O formulário de encaminhamento será adicionado aqui.
							</p>
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { REGINA_DOCTOR_ID } from '@/api/config/consts';
import {
	FileSearchIcon,
	FileTextIcon,
	PrinterIcon,
	SaveIcon,
	StethoscopeIcon,
} from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import type { PrescriptionDocumentData } from '@/api/schema/prescription-document.schema';
import RichTextDocumentBuilder from './rich-text-document-builder';
import {
	savePrescriptionDocument,
	updatePrescriptionDocument,
} from '@/api/actions/prescriptions.actions';
import RichTextClinicalDocument from '@/components/clinical-documents/rich-text-clinical-document';

interface ClinicalDocumentBuilderProps {
	petId: string;
	prescriptionId?: string;
	initialPrescription?: PrescriptionDocumentData | null;
	patient: PrescriptionPatientData;
	tutors: ClinicalDocumentTutor[];
}

type ClinicalDocumentType = 'prescription' | 'referral' | 'exam-request';

export interface ClinicalDocumentTutor {
	id: string;
	name: string;
}

export default function ClinicalDocumentBuilder({
	petId,
	prescriptionId,
	initialPrescription,
	patient,
	tutors,
}: ClinicalDocumentBuilderProps) {
	const [referralContent, setReferralContent] = useState('');
	const [examRequestContent, setExamRequestContent] = useState('');
	const [documentType, setDocumentType] =
		useState<ClinicalDocumentType>('prescription');
	const [prescriptionItems, setPrescriptionItems] = useState<
		PrescriptionDraftItem[]
	>(initialPrescription?.items ?? []);
	const [administrationRoute, setAdministrationRoute] = useState(
		initialPrescription?.administrationRoute ?? '',
	);
	const [selectedTutorId, setSelectedTutorId] = useState(
		initialPrescription?.tutor.id ?? tutors[0]?.id ?? '',
	);
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

	const updatePrescriptionAction = useAction(updatePrescriptionDocument, {
		onSuccess: () => {
			toast.success('Receita atualizada com sucesso!');
		},
		onError: ({ error }) => {
			console.error(error);
			toast.error('Não foi possível atualizar a receita.');
		},
	});

	const handleSavePrescription = () => {
		if (!canSavePrescription) {
			return;
		}

		const payload = {
			petId,
			tutorId: selectedTutorId,
			doctorId: REGINA_DOCTOR_ID,
			administrationRoute,
			items: prescriptionItems,
		};

		if (prescriptionId) {
			updatePrescriptionAction.execute({
				...payload,
				prescriptionId,
			});

			return;
		}

		savePrescriptionAction.execute(payload);
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

			<Tabs
				value={documentType}
				onValueChange={(value) =>
					setDocumentType(value as ClinicalDocumentType)
				}
			>
				<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
					<TabsList>
						<TabsTrigger value='prescription' className={'w-60'}>
							<FileTextIcon className='size-4' />
							Receita
						</TabsTrigger>

						<TabsTrigger value='referral' className={'w-60'}>
							<StethoscopeIcon className='size-4' />
							Encaminhamento
						</TabsTrigger>

						<TabsTrigger value='exam-request' className={'w-60'}>
							<FileSearchIcon className='size-4' />
							Solicitação de Exame
						</TabsTrigger>
					</TabsList>

					<div className={'flex flex-row gap-2'}>
						<Button
							type='button'
							onClick={handleSavePrescription}
							disabled={
								!canSavePrescription ||
								savePrescriptionAction.isExecuting ||
								updatePrescriptionAction.isExecuting
							}
							className={'w-40'}
						>
							<SaveIcon className='size-4' />

							{savePrescriptionAction.isExecuting ||
							updatePrescriptionAction.isExecuting
								? 'Salvando...'
								: prescriptionId
									? 'Atualizar'
									: 'Salvar'}
						</Button>

						<Button
							type='button'
							variant='outline'
							onClick={handlePrintPrescription}
							disabled={!canPrintPrescription}
							className={'w-40'}
						>
							<PrinterIcon className='size-4' />
							Imprimir
						</Button>
					</div>
				</div>

				<TabsContent value='prescription' className='mt-6'>
					<div className='rounded-xl border bg-card p-6'>
						<div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(500px,0.9fr)]'>
							<div className='min-w-0'>
								<div className='mb-3'>
									<h3 className='font-semibold'>Receita</h3>

									<p className='text-sm text-muted-foreground'>
										Adicione os medicamentos e as orientações da receita.
									</p>
								</div>

								<PrescriptionBuilder
									initialItems={initialPrescription?.items ?? []}
									initialAdministrationRoute={
										initialPrescription?.administrationRoute ?? ''
									}
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
					<div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(500px,0.9fr)]'>
						<div className='min-w-0 rounded-xl border bg-card p-6'>
							<div className='mb-6'>
								<h2 className='text-lg font-semibold'>Encaminhamento</h2>

								<p className='text-sm text-muted-foreground'>
									Descreva todas as informações necessárias para o profissional
									que receberá o paciente.
								</p>
							</div>

							<RichTextDocumentBuilder
								label='Conteúdo do encaminhamento'
								placeholder='Digite o encaminhamento...'
								onContentChange={setReferralContent}
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

								<div className='overflow-auto rounded-xl border bg-muted/40 p-4'>
									<RichTextClinicalDocument
										patient={{
											...patient,
											tutorName: selectedTutorName,
										}}
										title='Encaminhamento'
										content={referralContent}
									/>
								</div>
							</div>
						</div>
					</div>
				</TabsContent>

				<TabsContent value='exam-request' className='mt-6'>
					<div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(500px,0.9fr)]'>
						<div className='min-w-0 rounded-xl border bg-card p-6'>
							<div className='mb-6'>
								<h2 className='text-lg font-semibold'>Solicitação de Exame</h2>

								<p className='text-sm text-muted-foreground'>
									Informe os exames solicitados e todas as orientações
									necessárias.
								</p>
							</div>

							<RichTextDocumentBuilder
								label='Conteúdo da solicitação'
								placeholder='Digite os exames solicitados e as orientações...'
								onContentChange={setExamRequestContent}
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

								<div className='overflow-auto rounded-xl border bg-muted/40 p-4'>
									<RichTextClinicalDocument
										patient={{
											...patient,
											tutorName: selectedTutorName,
										}}
										title='Solicitação de Exame'
										content={examRequestContent}
									/>
								</div>
							</div>
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

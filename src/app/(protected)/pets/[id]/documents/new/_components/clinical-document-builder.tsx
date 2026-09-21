'use client';
'use no memo';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PrescriptionBuilder, {
	type PrescriptionDraftGroup,
} from './prescription-builder';
import { normalizePrescriptionGroups } from '@/lib/prescriptions/normalize-prescription-groups';
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
import { REGINA_DOCTOR_ID } from '@/api/config/consts';
import {
	DownloadIcon,
	FileSearchIcon,
	FileTextIcon,
	LoaderCircleIcon,
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
import { saveClinicalDocument } from '@/api/actions/clinical-documents.actions';
import A4DocumentPreview from '@/components/clinical-documents/a4-document-preview';
import { downloadElementAsPdf } from '@/lib/pdf/download-element-as-pdf';

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
	const referralPrintRef = useRef<HTMLDivElement>(null);
	const examRequestPrintRef = useRef<HTMLDivElement>(null);
	const [examRequestContent, setExamRequestContent] = useState('');
	const [documentType, setDocumentType] =
		useState<ClinicalDocumentType>('prescription');
	const [exportingType, setExportingType] =
		useState<ClinicalDocumentType | null>(null);
	const [selectedTutorId, setSelectedTutorId] = useState(
		initialPrescription?.tutor.id ?? tutors[0]?.id ?? '',
	);
	const selectedTutor = tutors.find((tutor) => tutor.id === selectedTutorId);
	const selectedTutorName = selectedTutor?.name ?? '-';
	const [prescriptionGroups, setPrescriptionGroups] = useState<
		PrescriptionDraftGroup[]
	>(() => {
		if (initialPrescription) {
			return normalizePrescriptionGroups(initialPrescription);
		}

		return [
			{
				administrationRoute: '',
				items: [],
			},
		];
	});
	const isPrescriptionValid =
		prescriptionGroups.length > 0 &&
		prescriptionGroups.every(
			(group) =>
				group.administrationRoute.trim() &&
				group.items.length > 0 &&
				group.items.every(
					(item) =>
						item.name.trim() &&
						item.quantity.trim() &&
						item.orientations.trim(),
				),
		);

	const canExportPrescription = isPrescriptionValid;

	const canSavePrescription = Boolean(selectedTutorId) && isPrescriptionValid;

	const prescriptionPrintRef = useRef<HTMLDivElement>(null);

	const handleExportPdf = async (
		type: ClinicalDocumentType,
		element: HTMLDivElement | null,
		filename: string,
	) => {
		if (!element || exportingType) return;

		setExportingType(type);

		try {
			await downloadElementAsPdf({ element, filename });
		} catch (error) {
			console.error(error);
			toast.error('Não foi possível gerar o PDF.');
		} finally {
			setExportingType(null);
		}
	};

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

	const saveClinicalDocumentAction = useAction(saveClinicalDocument, {
		onSuccess: ({ data }) => {
			toast.success(data?.message ?? 'Documento salvo com sucesso!');
		},
		onError: ({ error }) => {
			console.error(error);
			toast.error('Não foi possível salvar o documento.');
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
			groups: prescriptionGroups,
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

	const hasRichTextContent = (content: string) => {
		return (
			content
				.replace(/<[^>]*>/g, '')
				.replace(/&nbsp;/gi, ' ')
				.trim().length > 0
		);
	};

	const handleSaveRichTextDocument = (
		type: 'referral' | 'exam_request',
		content: string,
	) => {
		if (!selectedTutorId || !hasRichTextContent(content)) {
			return;
		}
		saveClinicalDocumentAction.execute({
			petId,
			tutorId: selectedTutorId,
			doctorId: REGINA_DOCTOR_ID,
			type,
			content,
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

			<Tabs
				value={documentType}
				onValueChange={(value) =>
					setDocumentType(value as ClinicalDocumentType)
				}
				className='min-w-0'
			>
				<div className='flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between'>
					<div className='min-w-0 xl:max-w-3xl xl:flex-1'>
						<div className='md:hidden'>
							<Select
								value={documentType}
								onValueChange={(value) =>
									setDocumentType(value as ClinicalDocumentType)
								}
							>
								<SelectTrigger className='h-11 w-full'>
									<SelectValue placeholder='Selecione o documento' />
								</SelectTrigger>

								<SelectContent>
									<SelectItem value='prescription'>Receita</SelectItem>
									<SelectItem value='referral'>Encaminhamento</SelectItem>
									<SelectItem value='exam-request'>
										Solicitação de Exame
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<TabsList className='hidden h-auto w-full grid-cols-3 md:grid'>
							<TabsTrigger value='prescription' className='min-w-0'>
								<FileTextIcon className='size-4' />
								<span className='truncate'>Receita</span>
							</TabsTrigger>

							<TabsTrigger value='referral' className='min-w-0'>
								<StethoscopeIcon className='size-4' />
								<span className='truncate'>Encaminhamento</span>
							</TabsTrigger>

							<TabsTrigger value='exam-request' className='min-w-0'>
								<FileSearchIcon className='size-4' />
								<span className='truncate'>Solicitação de Exame</span>
							</TabsTrigger>
						</TabsList>
					</div>

					{documentType === 'prescription' && (
						<div className='grid grid-cols-2 gap-2 sm:flex sm:justify-end'>
							<Button
								type='button'
								onClick={handleSavePrescription}
								disabled={
									!canSavePrescription ||
									savePrescriptionAction.isExecuting ||
									updatePrescriptionAction.isExecuting
								}
								className='min-w-0 sm:w-40'
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
								onClick={() =>
									handleExportPdf(
										'prescription',
										prescriptionPrintRef.current,
										`Receita - ${patient.name}.pdf`,
									)
								}
								disabled={!canExportPrescription || exportingType !== null}
								className='min-w-0 sm:w-40'
							>
								{exportingType === 'prescription' ? (
									<LoaderCircleIcon className='size-4 animate-spin' />
								) : (
									<DownloadIcon className='size-4' />
								)}
								{exportingType === 'prescription' ? 'Gerando...' : 'Baixar PDF'}
							</Button>
						</div>
					)}
				</div>

				<TabsContent value='prescription' className='mt-4 min-w-0 sm:mt-6'>
					<div className='min-w-0 rounded-xl border bg-card p-2 sm:p-4'>
						<div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(500px,0.9fr)]'>
							<div className='min-w-0 rounded-xl border bg-card p-3 sm:p-6'>
								<div className='min-w-0'>
									<div className='mb-3'>
										<h3 className='font-semibold'>Receita</h3>

										<p className='text-sm text-muted-foreground'>
											Adicione os medicamentos e as orientações da receita.
										</p>
									</div>

									<PrescriptionBuilder
										initialGroups={
											initialPrescription
												? normalizePrescriptionGroups(initialPrescription)
												: []
										}
										onGroupsChange={setPrescriptionGroups}
									/>
								</div>
							</div>

							<div className='min-w-0 rounded-xl border bg-card p-3 sm:p-6'>
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
										groups={prescriptionGroups}
									/>
								</div>
							</div>
						</div>
					</div>
				</TabsContent>

				<TabsContent value='referral' className='mt-4 min-w-0 sm:mt-6'>
					<div className='min-w-0 rounded-xl border bg-card p-2 sm:p-4'>
						<div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(500px,0.9fr)]'>
							<div className='min-w-0 rounded-xl border bg-card p-3 sm:p-6'>
								<div className='mb-6'>
									<h2 className='text-lg font-semibold'>Encaminhamento</h2>

									<p className='text-sm text-muted-foreground'>
										Descreva todas as informações necessárias para o
										profissional que receberá o paciente.
									</p>
								</div>

								<RichTextDocumentBuilder
									label='Conteúdo do encaminhamento'
									placeholder='Digite o encaminhamento...'
									onContentChange={setReferralContent}
								/>

								<div className='mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
									<Button
										type='button'
										variant='outline'
										onClick={() =>
											handleExportPdf(
												'referral',
												referralPrintRef.current,
												`Encaminhamento - ${patient.name}.pdf`,
											)
										}
										disabled={
											!hasRichTextContent(referralContent) ||
											exportingType !== null
										}
										className={'w-full lg:w-60'}
									>
										{exportingType === 'referral' ? (
											<LoaderCircleIcon className='size-4 animate-spin' />
										) : (
											<DownloadIcon className='size-4' />
										)}
										{exportingType === 'referral'
											? 'Gerando PDF...'
											: 'Baixar PDF'}
									</Button>

									<Button
										type='button'
										onClick={() =>
											handleSaveRichTextDocument('referral', referralContent)
										}
										disabled={
											!selectedTutorId ||
											!hasRichTextContent(referralContent) ||
											saveClinicalDocumentAction.isExecuting
										}
										className={'w-full lg:w-60'}
									>
										<SaveIcon className='size-4' />

										{saveClinicalDocumentAction.isExecuting
											? 'Salvando...'
											: 'Salvar encaminhamento'}
									</Button>
								</div>
							</div>

							<div className='min-w-0 rounded-xl border bg-card p-3 sm:p-6'>
								<div className='sticky top-6'>
									<div className='mb-3'>
										<h3 className='font-semibold'>Prévia</h3>

										<p className='text-sm text-muted-foreground'>
											Visualização aproximada da impressão em A4.
										</p>
									</div>

									<A4DocumentPreview>
										<RichTextClinicalDocument
											printRef={referralPrintRef}
											patient={{
												...patient,
												tutorName: selectedTutorName,
											}}
											title='Encaminhamento'
											content={referralContent}
										/>
									</A4DocumentPreview>
								</div>
							</div>
						</div>
					</div>
				</TabsContent>

				<TabsContent value='exam-request' className='mt-4 min-w-0 sm:mt-6'>
					<div className='min-w-0 rounded-xl border bg-card p-2 sm:p-4'>
						<div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(500px,0.9fr)]'>
							<div className='min-w-0 rounded-xl border bg-card p-3 sm:p-6'>
								<div className='mb-6'>
									<h2 className='text-lg font-semibold'>
										Solicitação de Exame
									</h2>

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

								<div className='mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
									<Button
										type='button'
										variant='outline'
										onClick={() =>
											handleExportPdf(
												'exam-request',
												examRequestPrintRef.current,
												`Solicitação de Exame - ${patient.name}.pdf`,
											)
										}
										disabled={
											!hasRichTextContent(examRequestContent) ||
											exportingType !== null
										}
										className={'w-full lg:w-60'}
									>
										{exportingType === 'exam-request' ? (
											<LoaderCircleIcon className='size-4 animate-spin' />
										) : (
											<DownloadIcon className='size-4' />
										)}
										{exportingType === 'exam-request'
											? 'Gerando PDF...'
											: 'Baixar PDF'}
									</Button>

									<Button
										type='button'
										onClick={() =>
											handleSaveRichTextDocument(
												'exam_request',
												examRequestContent,
											)
										}
										disabled={
											!selectedTutorId ||
											!hasRichTextContent(examRequestContent) ||
											saveClinicalDocumentAction.isExecuting
										}
										className={'w-full lg:w-60'}
									>
										<SaveIcon className='size-4' />

										{saveClinicalDocumentAction.isExecuting
											? 'Salvando...'
											: 'Salvar solicitação'}
									</Button>
								</div>
							</div>

							<div className='min-w-0 rounded-xl border bg-card p-3 sm:p-6'>
								<div className='sticky top-6'>
									<div className='mb-3'>
										<h3 className='font-semibold'>Prévia</h3>

										<p className='text-sm text-muted-foreground'>
											Visualização aproximada da impressão em A4.
										</p>
									</div>

									<A4DocumentPreview>
										<RichTextClinicalDocument
											printRef={examRequestPrintRef}
											patient={{
												...patient,
												tutorName: selectedTutorName,
											}}
											title='Solicitação de Exame'
											content={examRequestContent}
										/>
									</A4DocumentPreview>
								</div>
							</div>
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

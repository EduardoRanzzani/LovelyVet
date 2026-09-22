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
	LockKeyholeIcon,
	SaveIcon,
	ShieldCheckIcon,
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
import { signPrescriptionDocument } from '@/api/actions/prescription-signing.actions';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useRouter } from 'next/navigation';

interface PrescriptionSignatureState {
	id: string;
	signedAt: string;
	pdfSha256: string;

	signedByUser?: {
		id: string;
		name: string;
	} | null;
}

interface ClinicalDocumentBuilderProps {
	petId: string;
	prescriptionId?: string;
	initialPrescription?: PrescriptionDocumentData | null;

	initialSignature?: PrescriptionSignatureState | null;
	canSignPrescription: boolean;
	signingAsAdministrator: boolean;

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
	initialSignature,
	canSignPrescription,
	signingAsAdministrator,
	patient,
	tutors,
}: ClinicalDocumentBuilderProps) {
	const router = useRouter();
	const [currentPrescriptionId, setCurrentPrescriptionId] =
		useState(prescriptionId);
	const [isControlled, setIsControlled] = useState(
		initialPrescription?.isControlled ?? false,
	);
	const [signDigitally, setSignDigitally] = useState(false);
	const [signature, setSignature] = useState<PrescriptionSignatureState | null>(
		initialSignature ?? null,
	);
	const [signatureConfirmOpen, setSignatureConfirmOpen] = useState(false);
	const isPrescriptionSigned = Boolean(signature);
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

	const canSavePrescription =
		!isPrescriptionSigned && Boolean(selectedTutorId) && isPrescriptionValid;

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

	const savePrescriptionAction = useAction(savePrescriptionDocument);
	const updatePrescriptionAction = useAction(updatePrescriptionDocument);
	const signPrescriptionAction = useAction(signPrescriptionDocument);

	const isPrescriptionBusy =
		savePrescriptionAction.isExecuting ||
		updatePrescriptionAction.isExecuting ||
		signPrescriptionAction.isExecuting;

	const saveClinicalDocumentAction = useAction(saveClinicalDocument, {
		onSuccess: ({ data }) => {
			toast.success(data?.message ?? 'Documento salvo com sucesso!');
		},
		onError: ({ error }) => {
			console.error(error);
			toast.error('Não foi possível salvar o documento.');
		},
	});

	const persistPrescription = async (shouldSign: boolean) => {
		if (!canSavePrescription || isPrescriptionBusy) {
			return;
		}

		const payload = {
			petId,
			tutorId: selectedTutorId,
			doctorId: REGINA_DOCTOR_ID,
			isControlled,
			groups: prescriptionGroups,
		};

		try {
			let savedPrescriptionId = currentPrescriptionId;

			if (savedPrescriptionId) {
				const result = await updatePrescriptionAction.executeAsync({
					...payload,
					prescriptionId: savedPrescriptionId,
				});

				if (!result.data?.success) {
					throw new Error('Não foi possível atualizar a receita.');
				}
			} else {
				const result = await savePrescriptionAction.executeAsync(payload);

				if (!result.data?.id) {
					throw new Error('Não foi possível salvar a receita.');
				}

				savedPrescriptionId = result.data.id;

				setCurrentPrescriptionId(savedPrescriptionId);
			}

			if (shouldSign) {
				const signResult = await signPrescriptionAction.executeAsync({
					prescriptionId: savedPrescriptionId,
				});

				if (!signResult.data?.signatureId) {
					console.error('Erro ao assinar receita:', signResult);

					throw new Error(
						signResult.serverError ?? 'Não foi possível assinar a receita.',
					);
				}

				setSignature({
					id: signResult.data.signatureId,
					signedAt: signResult.data.signedAt,
					pdfSha256: signResult.data.pdfSha256,
				});

				setSignDigitally(false);

				toast.success('Receita salva e assinada digitalmente.');
			} else {
				toast.success(
					currentPrescriptionId
						? 'Receita atualizada com sucesso!'
						: 'Receita salva com sucesso!',
				);
			}

			if (!prescriptionId) {
				router.replace(
					`/pets/${petId}/documents/new?prescriptionId=${savedPrescriptionId}`,
				);
			}

			router.refresh();
		} catch (error) {
			console.error(error);

			toast.error(
				error instanceof Error
					? error.message
					: 'Não foi possível salvar a receita.',
			);
		}
	};

	const handleSavePrescription = () => {
		if (!canSavePrescription || isPrescriptionBusy) {
			return;
		}

		if (signDigitally) {
			setSignatureConfirmOpen(true);
			return;
		}

		void persistPrescription(false);
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
			<div className='max-w-md mb-6 space-y-2'>
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
				<div className='flex flex-col min-w-0 gap-4 xl:flex-row xl:items-center xl:justify-between'>
					<div className='min-w-0 xl:max-w-3xl xl:flex-1'>
						<div className='md:hidden'>
							<Select
								value={documentType}
								onValueChange={(value) =>
									setDocumentType(value as ClinicalDocumentType)
								}
							>
								<SelectTrigger className='w-full h-11'>
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

						<TabsList className='hidden w-full h-auto grid-cols-3 md:grid'>
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
									isPrescriptionBusy ||
									isPrescriptionSigned
								}
								className='min-w-0 sm:w-40'
							>
								{isPrescriptionSigned ? (
									<LockKeyholeIcon className='size-4' />
								) : isPrescriptionBusy ? (
									<LoaderCircleIcon className='size-4 animate-spin' />
								) : signDigitally ? (
									<ShieldCheckIcon className='size-4' />
								) : (
									<SaveIcon className='size-4' />
								)}

								{isPrescriptionSigned
									? 'Assinada'
									: isPrescriptionBusy
										? signDigitally
											? 'Assinando...'
											: 'Salvando...'
										: signDigitally
											? currentPrescriptionId
												? 'Atualizar e assinar'
												: 'Salvar e assinar'
											: currentPrescriptionId
												? 'Atualizar'
												: 'Salvar'}
							</Button>

							{isPrescriptionSigned && currentPrescriptionId ? (
								<Button
									type='button'
									variant='outline'
									className='min-w-0 sm:w-40'
									asChild
								>
									<a
										href={`/api/prescriptions/${currentPrescriptionId}/signed-pdf`}
									>
										<DownloadIcon className='size-4' />
										PDF assinado
									</a>
								</Button>
							) : (
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

									{exportingType === 'prescription'
										? 'Gerando...'
										: 'Baixar PDF'}
								</Button>
							)}
						</div>
					)}
				</div>

				<TabsContent value='prescription' className='min-w-0 mt-4 sm:mt-6'>
					<div className='min-w-0 p-2 border rounded-xl bg-card sm:p-4'>
						<div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(500px,0.9fr)]'>
							<div className='min-w-0 p-3 border rounded-xl bg-card sm:p-6'>
								<div className='min-w-0'>
									<div className='mb-3'>
										<h3 className='font-semibold'>Receita</h3>

										<p className='text-sm text-muted-foreground'>
											Adicione os medicamentos e as orientações da receita.
										</p>
									</div>

									<div className='p-4 mb-6 space-y-4 border rounded-lg bg-muted/20'>
										<div className='flex items-start gap-3'>
											<Checkbox
												id='controlled-prescription'
												checked={isControlled}
												disabled={isPrescriptionSigned}
												onCheckedChange={(checked) => {
													const controlled = checked === true;

													setIsControlled(controlled);

													if (!controlled) {
														setSignDigitally(false);
													}
												}}
											/>

											<div className='space-y-1'>
												<Label htmlFor='controlled-prescription'>
													Receita controlada
												</Label>

												<p className='text-xs text-muted-foreground'>
													Marque quando a receita for destinada a medicamento
													controlado.
												</p>
											</div>
										</div>

										{isControlled &&
											canSignPrescription &&
											!isPrescriptionSigned && (
												<div className='flex items-start gap-3'>
													<Checkbox
														id='sign-digitally'
														checked={signDigitally}
														onCheckedChange={(checked) =>
															setSignDigitally(checked === true)
														}
													/>

													<div className='space-y-1'>
														<Label htmlFor='sign-digitally'>
															Assinar digitalmente ao salvar
														</Label>

														<p className='text-xs text-muted-foreground'>
															{signingAsAdministrator
																? 'A assinatura será aplicada com o certificado digital da Dra. Regina. A operação ficará registrada no seu usuário administrador e, após assinada, a receita ficará imutável.'
																: 'A assinatura será aplicada com seu certificado digital e, após assinada, a receita ficará imutável.'}
														</p>
													</div>
												</div>
											)}

										{isControlled &&
											!canSignPrescription &&
											!isPrescriptionSigned && (
												<p className='text-xs text-muted-foreground'>
													A assinatura digital só pode ser realizada pela conta
													da veterinária proprietária do certificado.
												</p>
											)}

										{isPrescriptionSigned && signature && (
											<div className='flex flex-col gap-2 p-3 border rounded-md bg-background'>
												<div className='flex flex-wrap items-center gap-2'>
													<ShieldCheckIcon className='size-4' />

													<span className='text-sm font-medium'>
														Receita assinada digitalmente
													</span>

													<Badge variant='outline'>Bloqueada</Badge>
												</div>

												<p className='text-xs text-muted-foreground'>
													Assinada em{' '}
													{new Date(signature.signedAt).toLocaleString('pt-BR')}
												</p>

												{signature.signedByUser && (
													<p className='text-xs text-muted-foreground'>
														Operação realizada por{' '}
														<strong>{signature.signedByUser.name}</strong>
													</p>
												)}

												<p className='break-all font-mono text-[10px] text-muted-foreground'>
													SHA-256: {signature.pdfSha256}
												</p>
											</div>
										)}
									</div>

									{isPrescriptionSigned ? (
										<div className='flex items-center justify-center p-6 border border-dashed rounded-lg min-h-32'>
											<div className='text-center'>
												<LockKeyholeIcon className='mx-auto mb-2 size-6 text-muted-foreground' />

												<p className='font-medium'>
													Receita bloqueada para edição
												</p>

												<p className='mt-1 text-sm text-muted-foreground'>
													Este documento já possui assinatura digital.
												</p>
											</div>
										</div>
									) : (
										<PrescriptionBuilder
											initialGroups={
												initialPrescription
													? normalizePrescriptionGroups(initialPrescription)
													: []
											}
											onGroupsChange={setPrescriptionGroups}
										/>
									)}
								</div>
							</div>

							<div className='min-w-0 p-3 border rounded-xl bg-card sm:p-6'>
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
										isControlled={isControlled}
									/>
								</div>
							</div>
						</div>
					</div>
				</TabsContent>

				<TabsContent value='referral' className='min-w-0 mt-4 sm:mt-6'>
					<div className='min-w-0 p-2 border rounded-xl bg-card sm:p-4'>
						<div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(500px,0.9fr)]'>
							<div className='min-w-0 p-3 border rounded-xl bg-card sm:p-6'>
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

								<div className='flex flex-col-reverse gap-2 mt-6 sm:flex-row sm:justify-end'>
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

							<div className='min-w-0 p-3 border rounded-xl bg-card sm:p-6'>
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

				<TabsContent value='exam-request' className='min-w-0 mt-4 sm:mt-6'>
					<div className='min-w-0 p-2 border rounded-xl bg-card sm:p-4'>
						<div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(500px,0.9fr)]'>
							<div className='min-w-0 p-3 border rounded-xl bg-card sm:p-6'>
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

								<div className='flex flex-col-reverse gap-2 mt-6 sm:flex-row sm:justify-end'>
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

							<div className='min-w-0 p-3 border rounded-xl bg-card sm:p-6'>
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

			<AlertDialog
				open={signatureConfirmOpen}
				onOpenChange={setSignatureConfirmOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Assinar esta receita digitalmente?
						</AlertDialogTitle>

						<AlertDialogDescription>
							{signingAsAdministrator
								? 'Você está autorizando a aplicação do certificado digital da Dra. Regina nesta receita. A operação será registrada no seu usuário administrador. Após a assinatura, a receita não poderá mais ser editada ou excluída.'
								: 'A receita será assinada com seu certificado digital. Após a assinatura, ela não poderá mais ser editada ou excluída.'}
						</AlertDialogDescription>
					</AlertDialogHeader>

					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>

						<AlertDialogAction
							onClick={() => {
								setSignatureConfirmOpen(false);

								void persistPrescription(true);
							}}
						>
							<ShieldCheckIcon className='size-4' />
							Salvar e assinar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

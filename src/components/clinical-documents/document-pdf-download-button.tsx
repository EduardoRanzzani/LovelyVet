'use client';

import type {
	ClinicalDocumentSnapshot,
	ClinicalDocumentType,
} from '@/api/schema/clinical-documents.schema';
import type { PrescriptionDocumentData } from '@/api/schema/prescription-document.schema';
import PrescriptionDocument from '@/components/prescriptions/prescription-document';
import { Button } from '@/components/ui/button';
import { downloadElementAsPdf } from '@/lib/pdf/download-element-as-pdf';
import { DownloadIcon, LoaderCircleIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import RichTextClinicalDocument from './rich-text-clinical-document';

type PrescriptionPdfProps = {
	kind: 'prescription';
	documentData: PrescriptionDocumentData;
	issuedAt: Date | string;
};

type ClinicalDocumentPdfProps = {
	kind: 'clinical';
	type: ClinicalDocumentType;
	content: string;
	documentData: ClinicalDocumentSnapshot;
	issuedAt: Date | string;
};

type DocumentPdfDownloadButtonProps =
	| PrescriptionPdfProps
	| ClinicalDocumentPdfProps;

const A4_WIDTH_PX = Math.round(210 * (96 / 25.4));
const A4_HEIGHT_PX = Math.round(297 * (96 / 25.4));

export default function DocumentPdfDownloadButton(
	props: DocumentPdfDownloadButtonProps,
) {
	const documentRef = useRef<HTMLDivElement>(null);
	const [isExporting, setIsExporting] = useState(false);

	const date = new Date(props.issuedAt).toLocaleDateString('pt-BR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'America/Campo_Grande',
	});

	const title =
		props.kind === 'prescription'
			? 'Receita'
			: props.type === 'referral'
				? 'Encaminhamento'
				: 'Solicitação de Exame';

	const patientName = props.documentData.patient.name;

	const handleDownload = async () => {
		if (!documentRef.current || isExporting) {
			return;
		}

		setIsExporting(true);

		try {
			await downloadElementAsPdf({
				element: documentRef.current,
				filename: `${title} - ${patientName}.pdf`,
			});
		} catch (error) {
			console.error(error);

			toast.error('Não foi possível gerar o PDF.');
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<>
			<Button
				type='button'
				variant='outline'
				size='sm'
				onClick={handleDownload}
				disabled={isExporting}
			>
				{isExporting ? (
					<LoaderCircleIcon className='size-4 animate-spin' />
				) : (
					<DownloadIcon className='size-4' />
				)}

				{isExporting ? 'Gerando PDF...' : 'Exportar PDF'}
			</Button>

			<div
				aria-hidden='true'
				className='pointer-events-none fixed left-[-10000px] top-0 overflow-hidden'
				style={{
					width: A4_WIDTH_PX,
					height: A4_HEIGHT_PX,
				}}
			>
				{props.kind === 'prescription' ? (
					<PrescriptionDocument
						printRef={documentRef}
						patient={{
							...props.documentData.patient,
							tutorName: props.documentData.tutor.name,
							date,
						}}
						items={props.documentData.items}
						administrationRoute={props.documentData.administrationRoute}
					/>
				) : (
					<RichTextClinicalDocument
						printRef={documentRef}
						patient={{
							...props.documentData.patient,
							tutorName: props.documentData.tutor.name,
							date,
						}}
						title={title}
						content={props.content}
					/>
				)}
			</div>
		</>
	);
}

'use client';

import type {
	ClinicalDocumentSnapshot,
	ClinicalDocumentType,
} from '@/api/schema/clinical-documents.schema';
import { Button } from '@/components/ui/button';
import { PrinterIcon } from 'lucide-react';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import RichTextClinicalDocument from './rich-text-clinical-document';

interface ClinicalDocumentPrintButtonProps {
	type: ClinicalDocumentType;
	content: string;
	documentData: ClinicalDocumentSnapshot;
	issuedAt: Date | string;
}

export default function ClinicalDocumentPrintButton({
	type,
	content,
	documentData,
	issuedAt,
}: ClinicalDocumentPrintButtonProps) {
	const printRef = useRef<HTMLDivElement>(null);

	const title = type === 'referral' ? 'Encaminhamento' : 'Solicitação de Exame';

	const date = new Date(issuedAt).toLocaleDateString('pt-BR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'America/Campo_Grande',
	});

	const handlePrint = useReactToPrint({
		contentRef: printRef,

		documentTitle: `${title} - ${documentData.patient.name}`,

		pageStyle: `
				@page {
					size: A4 portrait;
					margin: 0;
				}

				@media print {
					html,
					body {
						width: 210mm !important;
						height: 297mm !important;
						margin: 0 !important;
						padding: 0 !important;
						background: white !important;
					}

					.clinical-document-print-area {
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

	return (
		<>
			<Button type='button' variant='outline' size='sm' onClick={handlePrint}>
				<PrinterIcon className='size-4' />
				Imprimir
			</Button>

			{/*
			 * Documento fica montado para o react-to-print,
			 * mas totalmente fora da área visível.
			 */}
			<div
				aria-hidden
				className='pointer-events-none fixed left-[-10000px] top-0'
			>
				<RichTextClinicalDocument
					printRef={printRef}
					patient={{
						...documentData.patient,

						tutorName: documentData.tutor.name,

						date,
					}}
					title={title}
					content={content}
				/>
			</div>
		</>
	);
}

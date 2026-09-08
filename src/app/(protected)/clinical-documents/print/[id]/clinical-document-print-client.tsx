'use client';

import type {
	ClinicalDocumentSnapshot,
	ClinicalDocumentType,
} from '@/api/schema/clinical-documents.schema';
import RichTextClinicalDocument from '@/components/clinical-documents/rich-text-clinical-document';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, PrinterIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

interface ClinicalDocumentPrintClientProps {
	petId: string;
	type: ClinicalDocumentType;
	content: string;
	documentData: ClinicalDocumentSnapshot;
	issuedAt: string;
}

export default function ClinicalDocumentPrintClient({
	petId,
	type,
	content,
	documentData,
	issuedAt,
}: ClinicalDocumentPrintClientProps) {
	const title = type === 'referral' ? 'Encaminhamento' : 'Solicitação de Exame';

	const date = new Date(issuedAt).toLocaleDateString('pt-BR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'America/Campo_Grande',
	});

	const printRef = useRef<HTMLDivElement>(null);

	const hasAutoPrintedRef = useRef(false);

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

				.prescription-print-area {
					width: 210mm !important;
					height: 297mm !important;
					max-width: none !important;
					margin: 0 !important;
					padding: 0 !important;
					overflow: hidden !important;
					box-shadow: none !important;
					background: white !important;

					-webkit-print-color-adjust: exact !important;
					print-color-adjust: exact !important;
				}
			}
		`,
	});

	useEffect(() => {
		const timeout = window.setTimeout(() => {
			if (hasAutoPrintedRef.current) {
				return;
			}

			hasAutoPrintedRef.current = true;

			handlePrint();
		}, 300);

		return () => {
			window.clearTimeout(timeout);
		};
	}, [handlePrint]);

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between gap-4'>
				<Button variant='outline' asChild>
					<Link href={`/pets/${petId}`}>
						<ArrowLeftIcon className='size-4' />
						Voltar
					</Link>
				</Button>

				<Button type='button' onClick={handlePrint}>
					<PrinterIcon className='size-4' />
					Imprimir
				</Button>
			</div>

			<div className='overflow-auto rounded-xl bg-muted/40 p-4'>
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
		</div>
	);
}

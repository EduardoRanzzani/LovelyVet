'use client';

import type { PrescriptionDocumentData } from '@/api/schema/prescription-document.schema';
import { Button } from '@/components/ui/button';
import { PrinterIcon } from 'lucide-react';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import PrescriptionDocument from './prescription-document';

interface PrescriptionPrintButtonProps {
	documentData: PrescriptionDocumentData;
	issuedAt: Date | string;
}

export default function PrescriptionPrintButton({
	documentData,
	issuedAt,
}: PrescriptionPrintButtonProps) {
	const printRef = useRef<HTMLDivElement>(null);

	const date = new Date(issuedAt).toLocaleDateString('pt-BR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'America/Campo_Grande',
	});

	const handlePrint = useReactToPrint({
		contentRef: printRef,

		documentTitle: `Receita - ${documentData.patient.name}`,

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

			<div
				aria-hidden
				className='pointer-events-none fixed left-[-10000px] top-0'
			>
				<PrescriptionDocument
					printRef={printRef}
					patient={{
						...documentData.patient,

						tutorName: documentData.tutor.name,

						date,
					}}
					items={documentData.items}
					administrationRoute={documentData.administrationRoute}
				/>
			</div>
		</>
	);
}

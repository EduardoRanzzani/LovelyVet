'use client';

import type {
	ClinicalDocumentSnapshot,
	ClinicalDocumentType,
} from '@/api/schema/clinical-documents.schema';
import A4DocumentPreview from '@/components/clinical-documents/a4-document-preview';
import RichTextClinicalDocument from '@/components/clinical-documents/rich-text-clinical-document';
import { Button } from '@/components/ui/button';
import { downloadElementAsPdf } from '@/lib/pdf/download-element-as-pdf';
import { ArrowLeftIcon, DownloadIcon, LoaderCircleIcon } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

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

	const documentRef = useRef<HTMLDivElement>(null);
	const hasAutoDownloadedRef = useRef(false);
	const [isExporting, setIsExporting] = useState(false);

	const handleDownload = useCallback(async () => {
		if (!documentRef.current || isExporting) return;

		setIsExporting(true);

		try {
			await downloadElementAsPdf({
				element: documentRef.current,
				filename: `${title} - ${documentData.patient.name}.pdf`,
			});
		} catch (error) {
			console.error(error);
			toast.error('Não foi possível gerar o PDF.');
		} finally {
			setIsExporting(false);
		}
	}, [documentData.patient.name, isExporting, title]);

	useEffect(() => {
		const timeout = window.setTimeout(() => {
			if (hasAutoDownloadedRef.current) return;

			hasAutoDownloadedRef.current = true;
			void handleDownload();
		}, 300);

		return () => window.clearTimeout(timeout);
	}, [handleDownload]);

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between gap-4'>
				<Button variant='outline' asChild>
					<Link href={`/pets/${petId}`}>
						<ArrowLeftIcon className='size-4' />
						Voltar
					</Link>
				</Button>

				<Button type='button' onClick={handleDownload} disabled={isExporting}>
					{isExporting ? (
						<LoaderCircleIcon className='size-4 animate-spin' />
					) : (
						<DownloadIcon className='size-4' />
					)}
					{isExporting ? 'Gerando PDF...' : 'Baixar PDF'}
				</Button>
			</div>

			<A4DocumentPreview>
				<RichTextClinicalDocument
					printRef={documentRef}
					patient={{
						...documentData.patient,
						tutorName: documentData.tutor.name,
						date,
					}}
					title={title}
					content={content}
				/>
			</A4DocumentPreview>
		</div>
	);
}

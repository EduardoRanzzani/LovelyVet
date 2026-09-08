'use client';

import { sanitizeRichTextHtml } from '@/lib/security/html';
import type { Ref } from 'react';
import ClinicalDocumentSheet, {
	type ClinicalDocumentPatient,
} from './clinical-document-sheet';

interface RichTextClinicalDocumentProps {
	patient: ClinicalDocumentPatient;
	title: string;
	content: string;
	printRef?: Ref<HTMLDivElement>;
}

export default function RichTextClinicalDocument({
	patient,
	title,
	content,
	printRef,
}: RichTextClinicalDocumentProps) {
	return (
		<ClinicalDocumentSheet patient={patient} title={title} printRef={printRef}>
			{content.trim() ? (
				<div
					className='prose prose-sm max-w-none text-[12px] leading-6 text-black'
					dangerouslySetInnerHTML={{
						__html: sanitizeRichTextHtml(content),
					}}
				/>
			) : (
				<p className='text-center text-[11px] text-zinc-400'>
					Digite o conteúdo do documento para visualizar.
				</p>
			)}
		</ClinicalDocumentSheet>
	);
}

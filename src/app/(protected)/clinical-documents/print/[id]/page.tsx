import { getClinicalDocumentById } from '@/api/actions/clinical-documents.actions';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import ClinicalDocumentPrintClient from './clinical-document-print-client';

interface ClinicalDocumentPrintPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function ClinicalDocumentPrintPage({
	params,
}: ClinicalDocumentPrintPageProps) {
	await connection();

	const { id } = await params;

	const document = await getClinicalDocumentById(id);

	if (!document) {
		notFound();
	}

	return (
		<div className='mx-auto max-w-5xl p-6'>
			<ClinicalDocumentPrintClient
				petId={document.petId}
				type={document.type}
				content={document.content}
				documentData={document.documentData}
				issuedAt={document.issuedAt.toISOString()}
			/>
		</div>
	);
}

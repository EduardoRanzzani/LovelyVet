import { getPrescriptionDocumentById } from '@/api/actions/prescriptions.actions';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import PrescriptionPrintClient from './prescription-print-client';

interface PrintPrescriptionPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function PrintPrescriptionPage({
	params,
}: PrintPrescriptionPageProps) {
	await connection();

	const { id } = await params;

	const prescription = await getPrescriptionDocumentById(id);

	if (!prescription || !prescription.documentData) {
		notFound();
	}

	return (
		<div className='mx-auto max-w-5xl p-6'>
			<PrescriptionPrintClient
				petId={prescription.petId}
				documentData={prescription.documentData}
				issuedAt={prescription.issuedAt.toISOString()}
			/>
		</div>
	);
}

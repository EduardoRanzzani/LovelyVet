import { db } from '@/db';
import { prescriptionSignaturesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getPrescriptionSignatureSummary(prescriptionId: string) {
	return db.query.prescriptionSignaturesTable.findFirst({
		where: eq(prescriptionSignaturesTable.prescriptionId, prescriptionId),

		columns: {
			id: true,
			prescriptionId: true,
			signedByUserId: true,
			pdfSha256: true,
			signedAt: true,
		},
	});
}

export async function assertPrescriptionIsUnsigned(
	prescriptionId: string,
): Promise<void> {
	const signature = await getPrescriptionSignatureSummary(prescriptionId);

	if (signature) {
		throw new Error(
			'Esta receita foi assinada digitalmente e não pode mais ser alterada.',
		);
	}
}

import { db } from '@/db';
import { prescriptionSignaturesTable, prescriptionsTable } from '@/db/schema';
import { requireAuthContext } from '@/lib/security/auth-context';
import { assertCanAccessPet } from '@/lib/security/pet-access';
import { eq } from 'drizzle-orm';

interface SignedPrescriptionPdfRouteProps {
	params: Promise<{
		id: string;
	}>;
}

export async function GET(
	_request: Request,
	{ params }: SignedPrescriptionPdfRouteProps,
) {
	const context = await requireAuthContext();
	const { id } = await params;

	const [result] = await db
		.select({
			petId: prescriptionsTable.petId,
			documentData: prescriptionsTable.documentData,
			pdf: prescriptionSignaturesTable.pdf,
			pdfSha256: prescriptionSignaturesTable.pdfSha256,
		})
		.from(prescriptionSignaturesTable)
		.innerJoin(
			prescriptionsTable,
			eq(prescriptionSignaturesTable.prescriptionId, prescriptionsTable.id),
		)
		.where(eq(prescriptionSignaturesTable.prescriptionId, id))
		.limit(1);

	if (!result) {
		return new Response('PDF assinado não encontrado.', {
			status: 404,
		});
	}

	await assertCanAccessPet(context, result.petId);
	const patientName = result.documentData?.patient.name ?? 'Paciente';
	const filename = `Receita - ${patientName} - assinada.pdf`;

	return new Response(new Uint8Array(result.pdf), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(
				filename,
			)}`,
			'Cache-Control': 'private, no-store',
			'X-Content-Type-Options': 'nosniff',
			'X-PDF-SHA256': result.pdfSha256,
		},
	});
}

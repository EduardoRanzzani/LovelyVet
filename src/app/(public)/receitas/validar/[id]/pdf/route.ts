import { db } from '@/db';
import { prescriptionSignaturesTable, prescriptionsTable } from '@/db/schema';
import {
	createItiPrescriptionResponse,
	isItiValidatorFormat,
	isValidItiSecretCode,
} from '@/lib/prescriptions/iti-validation';
import { getPrescriptionPdfUrl } from '@/lib/prescriptions/prescription-validation-url';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

interface PublicSignedPrescriptionPdfRouteProps {
	params: Promise<{
		id: string;
	}>;
}

export async function GET(
	request: Request,
	{ params }: PublicSignedPrescriptionPdfRouteProps,
) {
	const { id } = await params;
	const lookup = z.uuid().safeParse(id).success
		? eq(prescriptionSignaturesTable.id, id)
		: eq(prescriptionSignaturesTable.validationToken, id.trim().toUpperCase());

	const [result] = await db
		.select({
			documentData: prescriptionsTable.documentData,
			pdf: prescriptionSignaturesTable.pdf,
			pdfSha256: prescriptionSignaturesTable.pdfSha256,
			validationToken: prescriptionSignaturesTable.validationToken,
		})
		.from(prescriptionSignaturesTable)
		.innerJoin(
			prescriptionsTable,
			eq(prescriptionSignaturesTable.prescriptionId, prescriptionsTable.id),
		)
		.where(lookup)
		.limit(1);

	if (!result) {
		return new Response('PDF assinado não encontrado.', { status: 404 });
	}

	const requestUrl = new URL(request.url);
	const requestedFormat = requestUrl.searchParams.get('_format');

	if (isItiValidatorFormat(requestedFormat)) {
		const secretCode = requestUrl.searchParams.get('_secretCode');

		if (!isValidItiSecretCode(secretCode, result.validationToken)) {
			return Response.json(
				{ error: 'Código de acesso inválido.' },
				{ status: 401 },
			);
		}

		return Response.json(
			createItiPrescriptionResponse(`${getPrescriptionPdfUrl(id)}?raw=1`),
			{
				headers: {
					'Cache-Control': 'private, no-store',
				},
			},
		);
	}

	// Mobile browsers can download even inline PDFs. Human navigation uses our
	// renderer; API clients and the ITI still receive the original signed bytes.
	if (
		requestUrl.searchParams.get('raw') !== '1' &&
		request.headers.get('accept')?.includes('text/html')
	) {
		return new Response(null, {
			status: 307,
			headers: {
				Location: `/receitas/validar/${encodeURIComponent(id)}/visualizar`,
				'Cache-Control': 'private, no-store',
				Vary: 'Accept',
			},
		});
	}

	const patientName = result.documentData?.patient.name ?? 'Paciente';
	const filename = `Receita - ${patientName} - assinada.pdf`;

	return new Response(new Uint8Array(result.pdf), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(
				filename,
			)}`,
			'Cache-Control': 'private, no-store',
			'X-Content-Type-Options': 'nosniff',
			'X-PDF-SHA256': result.pdfSha256,
			Vary: 'Accept',
		},
	});
}

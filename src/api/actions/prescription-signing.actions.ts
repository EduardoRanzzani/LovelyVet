'use server';

import { REGINA_DOCTOR_ID } from '@/api/config/consts';
import { signPrescriptionDocumentSchema } from '@/api/schema/prescription-document.schema';
import { db } from '@/db';
import { prescriptionSignaturesTable, prescriptionsTable } from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { generatePrescriptionPdf } from '@/lib/pdf/generate-prescription-pdf';
import { signPrescriptionPdf } from '@/lib/pdf/sign-pdf-with-pfx';
import { generateQrCodePng } from '@/lib/qr-code';
import {
	getPrescriptionQrCodeUrl,
	getPrescriptionValidationUrl,
} from '@/lib/prescriptions/prescription-validation-url';
import { requireAuthContext } from '@/lib/security/auth-context';
import { assertCanSignWithReginaCertificate } from '@/lib/security/prescription-signing-access';
import { eq, sql } from 'drizzle-orm';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';

const createValidationToken = (): string =>
	randomBytes(6).toString('hex').toUpperCase();

export const signPrescriptionDocument = actionClient
	.schema(signPrescriptionDocumentSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();

		/*
		 * O certificado pertence à Regina.
		 *
		 * A autorização permite:
		 * - a própria Regina;
		 * - usuários admin autorizados pelo sistema.
		 *
		 * A receita, porém, obrigatoriamente precisa
		 * pertencer à Regina.
		 */
		assertCanSignWithReginaCertificate(context);

		const result = await db.transaction(async (tx) => {
			/*
			 * Bloqueia a receita até o final da operação.
			 *
			 * Isso impede edição ou assinatura concorrente
			 * enquanto os bytes definitivos do PDF são
			 * construídos.
			 */
			await tx.execute(sql`
				SELECT "id"
				FROM "prescriptions"
				WHERE "id" = ${parsedInput.prescriptionId}
				FOR UPDATE
			`);

			const prescription = await tx.query.prescriptionsTable.findFirst({
				where: eq(prescriptionsTable.id, parsedInput.prescriptionId),

				columns: {
					id: true,
					petId: true,
					doctorId: true,
					documentData: true,
					issuedAt: true,
				},
			});

			if (!prescription) {
				throw new Error('Receita não encontrada.');
			}

			if (prescription.doctorId !== REGINA_DOCTOR_ID) {
				throw new Error(
					'Esta receita não pertence à veterinária vinculada ao certificado.',
				);
			}

			if (!prescription.documentData) {
				throw new Error(
					'Esta receita não possui dados estruturados para assinatura.',
				);
			}

			const existingSignature =
				await tx.query.prescriptionSignaturesTable.findFirst({
					where: eq(
						prescriptionSignaturesTable.prescriptionId,
						prescription.id,
					),
					columns: { id: true },
				});

			if (existingSignature) {
				throw new Error('Esta receita já foi assinada digitalmente.');
			}

			/*
			 * O ID e o token são criados antes do PDF.
			 * O QR contém uma URL HTTPS sem parâmetros nem código de acesso.
			 * O ITI acrescenta _format e _secretCode para obter o JSON;
			 * o navegador comum abre o leitor da receita. O token impresso
			 * é o código de acesso informado ao ITI. ID e token são
			 * persistidos junto da assinatura definitiva.
			 */
			const signatureId = randomUUID();
			const validationToken = createValidationToken();
			const validationUrl = getPrescriptionValidationUrl(validationToken);
			const qrCodeUrl = getPrescriptionQrCodeUrl(signatureId);
			const validationQrCode = await generateQrCodePng(qrCodeUrl);

			/*
			 * O mesmo instante é utilizado:
			 *
			 * - no bloco visual do PDF;
			 * - no placeholder da assinatura;
			 * - na assinatura criptográfica;
			 * - no banco de dados.
			 */
			const signingTime = new Date();
			console.log('[SIGN] 1/5 Gerando PDF canônico...');

			/*
			 * IMPORTANTE:
			 *
			 * O QR entra no PDF ANTES da assinatura PFX.
			 *
			 * Portanto o QR também fica protegido
			 * criptograficamente pela assinatura.
			 */
			const unsignedPdf = await generatePrescriptionPdf({
				documentData: prescription.documentData,
				issuedAt: prescription.issuedAt,
				signingTime,
				validation: {
					url: validationUrl,
					qrCode: validationQrCode,
					token: validationToken,
				},
			});

			console.log(`[SIGN] 2/5 PDF gerado: ${unsignedPdf.length} bytes`);
			console.log('[SIGN] 3/5 Aplicando assinatura PFX...');

			const { pdf: signedPdf, certificate } = await signPrescriptionPdf({
				pdf: unsignedPdf,
				reason: prescription.documentData.isControlled
					? 'Assinatura digital de receita veterinária controlada'
					: 'Assinatura digital de receita veterinária',
				location: 'Campo Grande - MS',
				signingTime,
			});

			console.log(`[SIGN] 4/5 PDF assinado: ${signedPdf.length} bytes`);
			const pdfSha256 = createHash('sha256').update(signedPdf).digest('hex');

			console.log('[SIGN] SHA-256 calculado:', pdfSha256);
			console.log('[SIGN] 5/5 Persistindo assinatura no banco...');

			let signature: { id: string } | undefined;

			try {
				[signature] = await tx
					.insert(prescriptionSignaturesTable)
					.values({
						id: signatureId,
						prescriptionId: prescription.id,
						signedByUserId: context.userId,
						/*
						 * Esses são os bytes FINAIS,
						 * já contendo:
						 *
						 * - receita;
						 * - bloco visual;
						 * - QR Code;
						 * - assinatura PFX.
						 */
						pdf: signedPdf,
						pdfSha256,
						validationToken,
						certificateSubject: certificate.subject,
						certificateCommonName: certificate.commonName,
						certificateIssuer: certificate.issuer,
						certificateSerialNumber: certificate.serialNumber,
						certificateFingerprintSha256: certificate.fingerprintSha256,
						certificateValidFrom: certificate.validFrom,
						certificateValidTo: certificate.validTo,
						signedAt: signingTime,
					})
					.returning({
						id: prescriptionSignaturesTable.id,
					});
			} catch (error) {
				const cause =
					error instanceof Error && 'cause' in error ? error.cause : undefined;

				console.error('[SIGN] Falha ao persistir assinatura:', {
					prescriptionId: prescription.id,
					signatureId,
					pdfSize: signedPdf.length,
					pdfSha256,
					certificateCommonName: certificate.commonName,
					error:
						error instanceof Error
							? error.message.split('\n')[0]
							: String(error),
					cause,
				});

				throw new Error('Não foi possível persistir a assinatura digital.');
			}

			if (!signature) {
				throw new Error('Não foi possível persistir a assinatura digital.');
			}

			console.log('[SIGN] Assinatura persistida com sucesso:', signature.id);

			return {
				petId: prescription.petId,
				signatureId: signature.id,
				signedAt: signingTime.toISOString(),
				pdfSha256,
				validationToken,
				certificate: {
					commonName: certificate.commonName,
					serialNumber: certificate.serialNumber,
					fingerprintSha256: certificate.fingerprintSha256,
					validFrom: certificate.validFrom.toISOString(),
					validTo: certificate.validTo.toISOString(),
				},
			};
		});

		revalidatePath(`/pets/${result.petId}`);
		revalidatePath('/prescriptions');

		return {
			success: true,
			signatureId: result.signatureId,
			signedAt: result.signedAt,
			pdfSha256: result.pdfSha256,
			validationToken: result.validationToken,
			certificate: result.certificate,
			message: 'Receita assinada digitalmente com sucesso.',
		};
	});

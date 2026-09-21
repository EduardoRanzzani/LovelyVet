'use server';

import { REGINA_DOCTOR_ID } from '@/api/config/consts';
import { signPrescriptionDocumentSchema } from '@/api/schema/prescription-document.schema';
import { db } from '@/db';
import { prescriptionSignaturesTable, prescriptionsTable } from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { generatePrescriptionPdf } from '@/lib/pdf/generate-prescription-pdf';
import { signPrescriptionPdf } from '@/lib/pdf/sign-pdf-with-pfx';
import { requireAuthContext } from '@/lib/security/auth-context';
import { createHash } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const REGINA_SIGNER_NAME = 'Regina de Oliveira Maciel';

export const signPrescriptionDocument = actionClient
	.schema(signPrescriptionDocumentSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();

		/*
		 * Não basta ser admin/staff.
		 *
		 * Estamos usando a chave privada da Regina,
		 * então apenas a própria conta de doctor
		 * vinculada ao REGINA_DOCTOR_ID pode executar
		 * esta operação.
		 */
		if (context.role !== 'doctor' || context.doctorId !== REGINA_DOCTOR_ID) {
			throw new Error(
				'Apenas a veterinária proprietária do certificado pode assinar esta receita.',
			);
		}

		const result = await db.transaction(async (tx) => {
			/*
			 * Bloqueia a receita até o final
			 * da assinatura.
			 *
			 * Isso impede uma edição concorrente
			 * exatamente enquanto os bytes
			 * definitivos do PDF são construídos.
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

			if (prescription.documentData.isControlled !== true) {
				throw new Error(
					'Apenas receitas controladas podem ser assinadas digitalmente.',
				);
			}

			const existingSignature =
				await tx.query.prescriptionSignaturesTable.findFirst({
					where: eq(
						prescriptionSignaturesTable.prescriptionId,
						prescription.id,
					),
					columns: {
						id: true,
					},
				});

			if (existingSignature) {
				throw new Error('Esta receita já foi assinada digitalmente.');
			}

			/*
			 * Usamos o mesmo instante tanto
			 * no PDF visual quanto no placeholder
			 * da assinatura e no banco.
			 */
			const signingTime = new Date();

			const unsignedPdf = await generatePrescriptionPdf({
				documentData: prescription.documentData,
				issuedAt: prescription.issuedAt,
				signingTime,
			});

			const signedPdf = await signPrescriptionPdf({
				pdf: unsignedPdf,
				signerName: REGINA_SIGNER_NAME,
				reason: 'Assinatura digital de receita veterinária controlada',
				location: 'Campo Grande - MS',
				signingTime,
			});

			const pdfSha256 = createHash('sha256').update(signedPdf).digest('hex');

			const [signature] = await tx
				.insert(prescriptionSignaturesTable)
				.values({
					prescriptionId: prescription.id,
					signedByUserId: context.userId,
					pdf: signedPdf,
					pdfSha256,
					signedAt: signingTime,
				})
				.returning({
					id: prescriptionSignaturesTable.id,
				});
			if (!signature) {
				throw new Error('Não foi possível persistir a assinatura digital.');
			}

			return {
				petId: prescription.petId,
				signatureId: signature.id,
				signedAt: signingTime.toISOString(),
				pdfSha256,
			};
		});

		revalidatePath(`/pets/${result.petId}`);

		revalidatePath('/prescriptions');

		return {
			success: true,
			signatureId: result.signatureId,
			signedAt: result.signedAt,
			pdfSha256: result.pdfSha256,
			message: 'Receita assinada digitalmente com sucesso.',
		};
	});

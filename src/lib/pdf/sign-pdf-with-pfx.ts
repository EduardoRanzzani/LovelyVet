import { pdflibAddPlaceholder } from '@signpdf/placeholder-pdf-lib';
import { P12Signer } from '@signpdf/signer-p12';
import signpdf from '@signpdf/signpdf';
import { SUBFILTER_ETSI_CADES_DETACHED } from '@signpdf/utils';
import { PDFDocument } from 'pdf-lib';
import {
	getPrescriptionSigningCertificate,
	type PrescriptionSigningCertificateMetadata,
} from './prescription-signing-certificate';

interface SignPrescriptionPdfOptions {
	pdf: Buffer | Uint8Array;
	reason?: string;
	location?: string;
	contactInfo?: string;
	signingTime?: Date;
}

interface SignPrescriptionPdfResult {
	pdf: Buffer;
	certificate: PrescriptionSigningCertificateMetadata;
}

export async function signPrescriptionPdf({
	pdf,
	reason = 'Assinatura digital de receita veterinária',
	location = 'Campo Grande - MS',
	contactInfo = '',
	signingTime = new Date(),
}: SignPrescriptionPdfOptions): Promise<SignPrescriptionPdfResult> {
	const {
		buffer: certificate,
		passphrase,
		metadata,
	} = await getPrescriptionSigningCertificate(signingTime);

	const pdfDocument = await PDFDocument.load(pdf, {
		updateMetadata: false,
	});

	pdflibAddPlaceholder({
		pdfDoc: pdfDocument,
		reason,
		contactInfo,
		/*
		 * Não usamos mais um nome hardcoded.
		 * O nome exibido vem do próprio certificado.
		 */
		name: metadata.commonName,
		location,
		signingTime,
		/*
		 * Reservamos espaço adicional para a cadeia
		 * ICP-Brasil/CMS.
		 */
		signatureLength: 65_536,
		subFilter: SUBFILTER_ETSI_CADES_DETACHED,
		appName: 'LovelyVet',
	});

	const pdfWithPlaceholder = await pdfDocument.save();

	const signer = new P12Signer(certificate, {
		passphrase,
	});

	let signedPdf: Buffer;

	try {
		signedPdf = await signpdf.sign(Buffer.from(pdfWithPlaceholder), signer);
	} catch (error) {
		console.error('[PFX] Falha ao assinar PDF:', error);
		throw new Error(
			error instanceof Error
				? `Falha criptográfica ao assinar o PDF: ${error.message}`
				: 'Falha criptográfica ao assinar o PDF.',
		);
	}

	return {
		pdf: Buffer.from(signedPdf),
		certificate: metadata,
	};
}

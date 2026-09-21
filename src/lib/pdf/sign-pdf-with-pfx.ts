import { pdflibAddPlaceholder } from '@signpdf/placeholder-pdf-lib';
import { P12Signer } from '@signpdf/signer-p12';
import signpdf from '@signpdf/signpdf';
import { SUBFILTER_ETSI_CADES_DETACHED } from '@signpdf/utils';
import { PDFDocument } from 'pdf-lib';
import { getPrescriptionSigningCertificate } from './prescription-signing-certificate';

interface SignPrescriptionPdfOptions {
	pdf: Buffer | Uint8Array;
	signerName: string;
	reason?: string;
	location?: string;
	contactInfo?: string;
	signingTime?: Date;
}

export async function signPrescriptionPdf({
	pdf,
	signerName,
	reason = 'Assinatura digital de receita veterinária',
	location = 'Campo Grande - MS',
	contactInfo = '',
	signingTime = new Date(),
}: SignPrescriptionPdfOptions): Promise<Buffer> {
	const { buffer: certificate, passphrase } =
		await getPrescriptionSigningCertificate();

	const pdfDocument = await PDFDocument.load(pdf, {
		updateMetadata: false,
	});

	/*
	 * Reserva espaço no PDF para a assinatura CMS/PKCS#7.
	 *
	 * Certificados ICP-Brasil normalmente carregam uma cadeia de
	 * certificados razoavelmente grande, então reservamos mais espaço
	 * que o mínimo padrão.
	 */
	pdflibAddPlaceholder({
		pdfDoc: pdfDocument,
		reason,
		contactInfo,
		name: signerName,
		location,
		signingTime,
		signatureLength: 32_768,
		/*
		 * PAdES utiliza ETSI.CAdES.detached em vez do
		 * adbe.pkcs7.detached tradicional.
		 */
		subFilter: SUBFILTER_ETSI_CADES_DETACHED,
		appName: 'LovelyVet',
	});

	const pdfWithPlaceholder = await pdfDocument.save();

	const signer = new P12Signer(certificate, {
		passphrase,
	});

	const signedPdf = await signpdf.sign(Buffer.from(pdfWithPlaceholder), signer);

	return Buffer.from(signedPdf);
}

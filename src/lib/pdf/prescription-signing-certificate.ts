import { readFile } from 'node:fs/promises';

interface PrescriptionSigningCertificate {
	buffer: Buffer;
	passphrase: string;
}

export async function getPrescriptionSigningCertificate(): Promise<PrescriptionSigningCertificate> {
	const path = process.env.PRESCRIPTION_SIGNING_PFX_PATH;
	const passphrase = process.env.PRESCRIPTION_SIGNING_PFX_PASSWORD;

	if (!path) {
		throw new Error('PRESCRIPTION_SIGNING_PFX_PATH não foi configurado.');
	}

	if (!passphrase) {
		throw new Error('PRESCRIPTION_SIGNING_PFX_PASSWORD não foi configurado.');
	}

	let buffer: Buffer;

	try {
		buffer = await readFile(path);
	} catch (error) {
		console.error('Não foi possível ler o certificado de assinatura.', error);

		throw new Error('Certificado digital de assinatura não está disponível.');
	}

	if (buffer.length === 0) {
		throw new Error('O certificado digital configurado está vazio.');
	}

	return {
		buffer,
		passphrase,
	};
}

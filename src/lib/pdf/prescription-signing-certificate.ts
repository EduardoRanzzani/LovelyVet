import { createHash, X509Certificate } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import forge from 'node-forge';

export interface PrescriptionSigningCertificateMetadata {
	subject: string;
	commonName: string;
	issuer: string;
	serialNumber: string;
	fingerprintSha256: string;
	validFrom: Date;
	validTo: Date;
}

export interface PrescriptionSigningCertificate {
	buffer: Buffer;
	passphrase: string;
	metadata: PrescriptionSigningCertificateMetadata;
}

function normalizeFingerprint(value: string): string {
	return value.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
}

function getBagLocalKeyIdHex(bag: forge.pkcs12.Bag | undefined): string | null {
	const localKeyId = bag?.attributes?.localKeyId?.[0];

	if (!localKeyId) {
		return null;
	}

	return forge.util.bytesToHex(localKeyId).toUpperCase();
}

function getCertificateBag(p12: forge.pkcs12.Pkcs12Pfx): forge.pkcs12.Bag {
	const certBagOid = forge.pki.oids.certBag;

	const certBags =
		p12.getBags({
			bagType: certBagOid,
		})[certBagOid] ?? [];

	if (certBags.length === 0) {
		throw new Error('O arquivo PFX não contém certificado digital.');
	}

	/*
	 * Primeiro tentamos descobrir qual certificado está
	 * associado à chave privada através do localKeyId.
	 */
	const privateKeyBagOids = [
		forge.pki.oids.pkcs8ShroudedKeyBag,
		forge.pki.oids.keyBag,
	];

	let privateKeyLocalKeyId: string | null = null;

	for (const bagType of privateKeyBagOids) {
		const keyBag = p12.getBags({
			bagType,
		})[bagType]?.[0];

		const localKeyId = getBagLocalKeyIdHex(keyBag);

		if (localKeyId) {
			privateKeyLocalKeyId = localKeyId;

			break;
		}
	}

	if (privateKeyLocalKeyId) {
		const matchingCertificate = certBags.find(
			(bag) => getBagLocalKeyIdHex(bag) === privateKeyLocalKeyId,
		);

		if (matchingCertificate?.cert) {
			return matchingCertificate;
		}
	}

	/*
	 * Alguns PFX não possuem localKeyId utilizável.
	 *
	 * Como fallback, procuramos o certificado "folha":
	 * aquele que não é emissor de outro certificado da
	 * própria cadeia.
	 */
	const bagsWithCertificate = certBags.filter(
		(
			bag,
		): bag is forge.pkcs12.Bag & {
			cert: forge.pki.Certificate;
		} => Boolean(bag.cert),
	);

	if (bagsWithCertificate.length === 1) {
		return bagsWithCertificate[0];
	}

	const certificateSubject = (certificate: forge.pki.Certificate) =>
		certificate.subject.attributes
			.map((attribute) => `${attribute.type}=${String(attribute.value)}`)
			.join('|');

	const certificateIssuer = (certificate: forge.pki.Certificate) =>
		certificate.issuer.attributes
			.map((attribute) => `${attribute.type}=${String(attribute.value)}`)
			.join('|');

	const leafBag = bagsWithCertificate.find((candidate) => {
		if (!candidate.cert) {
			return false;
		}

		const candidateSubject = certificateSubject(candidate.cert);

		const issuesAnotherCertificate = bagsWithCertificate.some((other) => {
			if (!other.cert || other === candidate) {
				return false;
			}

			return certificateIssuer(other.cert) === candidateSubject;
		});

		return !issuesAnotherCertificate;
	});

	if (!leafBag?.cert) {
		throw new Error(
			'Não foi possível identificar o certificado associado à chave privada do PFX.',
		);
	}

	return leafBag;
}

function parseCertificateMetadata(
	buffer: Buffer,
	passphrase: string,
): PrescriptionSigningCertificateMetadata {
	let p12: forge.pkcs12.Pkcs12Pfx;

	try {
		const p12Asn1 = forge.asn1.fromDer(buffer.toString('binary'));

		p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, passphrase);
	} catch (error) {
		console.error('Não foi possível abrir o certificado PFX.', error);

		throw new Error('Certificado digital ou senha do certificado inválidos.');
	}

	const certificateBag = getCertificateBag(p12);

	const certificate = certificateBag.cert;

	if (!certificate) {
		throw new Error('Certificado digital não encontrado no PFX.');
	}

	const certificateAsn1 = forge.pki.certificateToAsn1(certificate);

	const certificateDer = Buffer.from(
		forge.asn1.toDer(certificateAsn1).getBytes(),
		'binary',
	);

	const x509 = new X509Certificate(certificateDer);

	const fingerprintSha256 = createHash('sha256')
		.update(certificateDer)
		.digest('hex')
		.toUpperCase();

	const commonName = certificate.subject.getField('CN')?.value;

	const validFrom = certificate.validity.notBefore;

	const validTo = certificate.validity.notAfter;

	return {
		subject: x509.subject,
		commonName: typeof commonName === 'string' ? commonName : x509.subject,
		issuer: x509.issuer,
		serialNumber: x509.serialNumber.toUpperCase(),
		fingerprintSha256,
		validFrom,
		validTo,
	};
}

function validateCertificate(
	metadata: PrescriptionSigningCertificateMetadata,
	at: Date,
): void {
	if (at < metadata.validFrom) {
		throw new Error(
			'O certificado digital ainda não está dentro do período de validade.',
		);
	}

	if (at > metadata.validTo) {
		throw new Error(
			'O certificado digital utilizado para assinatura está expirado.',
		);
	}

	const configuredFingerprint =
		process.env.PRESCRIPTION_SIGNING_CERTIFICATE_SHA256;

	if (!configuredFingerprint) {
		throw new Error(
			'PRESCRIPTION_SIGNING_CERTIFICATE_SHA256 não foi configurado.',
		);
	}

	const expected = normalizeFingerprint(configuredFingerprint);

	const actual = normalizeFingerprint(metadata.fingerprintSha256);

	if (expected !== actual) {
		throw new Error(
			'O certificado digital configurado não corresponde ao certificado autorizado para assinatura de receitas.',
		);
	}
}

export async function getPrescriptionSigningCertificate(
	at: Date = new Date(),
): Promise<PrescriptionSigningCertificate> {
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

	const metadata = parseCertificateMetadata(buffer, passphrase);

	validateCertificate(metadata, at);

	return {
		buffer,
		passphrase,
		metadata,
	};
}

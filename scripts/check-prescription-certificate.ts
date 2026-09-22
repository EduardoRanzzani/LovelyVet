import { config } from 'dotenv';
import forge from 'node-forge';
import { createHash, X509Certificate } from 'node:crypto';
import { getPrescriptionSigningCertificate } from '../src/lib/pdf/prescription-signing-certificate';

config();

function normalizeFingerprint(value: string): string {
	return value.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
}

function formatDate(date: Date): string {
	return new Intl.DateTimeFormat('pt-BR', {
		dateStyle: 'full',
		timeStyle: 'long',
		timeZone: 'America/Campo_Grande',
	}).format(date);
}

async function main() {
	console.log('\n🔐 Verificando certificado de assinatura do LovelyVet...\n');
	const { buffer, passphrase } = await getPrescriptionSigningCertificate();
	console.log(
		`✓ Arquivo PFX carregado (${buffer.length.toLocaleString('pt-BR')} bytes)`,
	);

	let p12: forge.pkcs12.Pkcs12Pfx;

	try {
		const p12Asn1 = forge.asn1.fromDer(buffer.toString('binary'));
		p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, passphrase);
	} catch (error) {
		console.error('\n✗ Não foi possível abrir o PFX.');
		console.error(
			'  Verifique se a senha está correta e se o arquivo é um PKCS#12 válido.',
		);

		throw error;
	}

	console.log('✓ PFX aberto com sucesso');

	const certBagOid = forge.pki.oids.certBag;

	const certificateBags =
		p12.getBags({
			bagType: certBagOid,
		})[certBagOid] ?? [];

	if (certificateBags.length === 0) {
		throw new Error('O PFX não contém nenhum certificado.');
	}

	console.log(
		`✓ ${certificateBags.length} certificado(s) encontrado(s) no PFX\n`,
	);

	const certificates = certificateBags
		.filter((bag) => Boolean(bag.cert))
		.map((bag, index) => {
			const certificate = bag.cert;

			if (!certificate) {
				throw new Error('Certificado inválido dentro do PFX.');
			}

			const certificateAsn1 = forge.pki.certificateToAsn1(certificate);

			const der = Buffer.from(
				forge.asn1.toDer(certificateAsn1).getBytes(),
				'binary',
			);

			const x509 = new X509Certificate(der);

			const fingerprintSha256 = createHash('sha256')
				.update(der)
				.digest('hex')
				.toUpperCase();

			const commonNameField = certificate.subject.getField('CN');

			const commonName = commonNameField?.value
				? String(commonNameField.value)
				: '(CN não encontrado)';

			return {
				index,
				x509,
				commonName,
				fingerprintSha256,
				validFrom: new Date(x509.validFrom),
				validTo: new Date(x509.validTo),
			};
		});

	for (const certificate of certificates) {
		console.log(`Certificado ${certificate.index + 1}`);

		console.log(
			`  Tipo:        ${
				certificate.x509.ca
					? 'Autoridade certificadora (CA)'
					: 'Certificado final / provável signatário'
			}`,
		);

		console.log(`  CN:          ${certificate.commonName}`);
		console.log(`  Subject:     ${certificate.x509.subject}`);
		console.log(`  Issuer:      ${certificate.x509.issuer}`);
		console.log(`  Serial:      ${certificate.x509.serialNumber}`);
		console.log(`  Válido de:   ${formatDate(certificate.validFrom)}`);
		console.log(`  Válido até:  ${formatDate(certificate.validTo)}`);
		console.log(`  SHA-256:     ${certificate.fingerprintSha256}`);
		console.log('');
	}

	/*
	 * O certificado do signatário normalmente é o certificado
	 * final, isto é, aquele que não possui flag de CA.
	 */
	const signingCertificate = certificates.find(
		(certificate) => !certificate.x509.ca,
	);

	if (!signingCertificate) {
		throw new Error(
			'Não foi possível identificar o certificado final do signatário.',
		);
	}

	console.log('────────────────────────────────────────────────────');
	console.log('Certificado identificado como signatário:');
	console.log(`  ${signingCertificate.commonName}`);
	console.log(`  Serial: ${signingCertificate.x509.serialNumber}`);
	console.log(`  SHA-256: ${signingCertificate.fingerprintSha256}`);
	console.log('────────────────────────────────────────────────────\n');

	const now = new Date();
	let hasError = false;

	if (now < signingCertificate.validFrom) {
		console.error('✗ O certificado ainda não está válido.');
		hasError = true;
	} else if (now > signingCertificate.validTo) {
		console.error('✗ O certificado está expirado.');
		hasError = true;
	} else {
		console.log('✓ Certificado está dentro do período de validade');
	}

	const configuredFingerprint =
		process.env.PRESCRIPTION_SIGNING_CERTIFICATE_SHA256;

	if (!configuredFingerprint) {
		console.error(
			'\n✗ PRESCRIPTION_SIGNING_CERTIFICATE_SHA256 não está configurado.',
		);
		console.log('\nUse este valor no .env:');
		console.log(
			`PRESCRIPTION_SIGNING_CERTIFICATE_SHA256=${signingCertificate.fingerprintSha256}`,
		);

		hasError = true;
	} else {
		const expected = normalizeFingerprint(configuredFingerprint);
		const actual = normalizeFingerprint(signingCertificate.fingerprintSha256);

		if (expected !== actual) {
			console.error(
				'\n✗ O fingerprint configurado NÃO corresponde ao certificado.',
			);
			console.error(`  Configurado: ${expected}`);
			console.error(`  Certificado: ${actual}`);
			hasError = true;
		} else {
			console.log('✓ Fingerprint SHA-256 confere com o .env');
		}
	}

	if (hasError) {
		console.error('\n❌ Certificado NÃO está pronto para assinatura.\n');
		process.exitCode = 1;
		return;
	}
	console.log('\n✅ Certificado carregado e validado com sucesso.');
	console.log(
		'Nenhum documento foi assinado e nenhuma informação foi gravada no banco.\n',
	);
}

main().catch((error) => {
	console.error('\n❌ Erro ao verificar certificado:\n');
	console.error(error);
	process.exitCode = 1;
});

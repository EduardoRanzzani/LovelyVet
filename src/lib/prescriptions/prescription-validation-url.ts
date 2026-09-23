export const getPrescriptionValidationUrl = (signatureId: string): string => {
	const appUrl = process.env.APP_URL;

	if (!appUrl) {
		throw new Error('APP_URL não foi configurado.');
	}

	return `${appUrl.replace(/\/$/, '')}/receitas/validar/${signatureId}`;
};

export const getPrescriptionPdfUrl = (signatureId: string): string =>
	`${getPrescriptionValidationUrl(signatureId)}/pdf`;

/** The ITI appends its own parameters; the QR must not contain the access code. */
export const getPrescriptionQrCodeUrl = (signatureId: string): string => {
	const url = new URL(getPrescriptionPdfUrl(signatureId));
	if (
		url.protocol !== 'https:' ||
		url.search ||
		url.hash ||
		url.username ||
		url.password
	) {
		throw new Error(
			'Configure APP_URL com uma URL HTTPS sem parâmetros, fragmentos ou credenciais para gerar o QR Code do ITI.',
		);
	}
	return url.href;
};

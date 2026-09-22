export const getPrescriptionValidationUrl = (signatureId: string): string => {
	const appUrl = process.env.APP_URL;

	if (!appUrl) {
		throw new Error('APP_URL não foi configurado.');
	}

	return `${appUrl.replace(/\/$/, '')}/receitas/validar/${signatureId}`;
};

export const getPrescriptionPdfUrl = (signatureId: string): string =>
	`${getPrescriptionValidationUrl(signatureId)}/pdf`;

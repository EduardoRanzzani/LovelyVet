export const ITI_VALIDATOR_FORMAT = 'application/validador-iti+json';

export const isValidItiSecretCode = (
	providedCode: string | null,
	expectedCode: string,
): boolean =>
	providedCode?.trim().toUpperCase() === expectedCode.trim().toUpperCase();

export const createItiPrescriptionResponse = (pdfUrl: string) => ({
	version: '1.0.0',
	prescription: {
		signatureFiles: [{ url: pdfUrl }],
	},
});

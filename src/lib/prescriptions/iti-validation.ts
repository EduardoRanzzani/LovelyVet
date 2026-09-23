export const ITI_VALIDATOR_FORMAT = 'application/validador-iti+json';

// URLSearchParams decodes a literal '+' as a space. Accept both the encoded
// value and the unescaped query string shown in the ITI documentation.
export const isItiValidatorFormat = (format: string | null): boolean =>
	format?.replace(' ', '+') === ITI_VALIDATOR_FORMAT;

export const isValidItiSecretCode = (
	providedCode: string | null,
	expectedCode: string,
): boolean => {
	if (providedCode === null) return false;
	const normalizedCode = providedCode.trim();
	return (
		/^[a-z0-9]{0,64}$/i.test(normalizedCode) &&
		normalizedCode.toUpperCase() === expectedCode.trim().toUpperCase()
	);
};

export const createItiPrescriptionResponse = (pdfUrl: string) => ({
	version: '1.0.0',
	prescription: {
		signatureFiles: [{ url: pdfUrl }],
	},
});

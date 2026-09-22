import QRCode from 'qrcode';

export const generateQrCodePng = async (value: string): Promise<Buffer> => {
	return QRCode.toBuffer(value, {
		type: 'png',
		errorCorrectionLevel: 'M',
		margin: 1,
		width: 320,
	});
};

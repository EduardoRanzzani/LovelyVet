import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

// O manifest autentica o identificador, não os campos do JSON da notificação.
export function isMercadoPagoWebhookSignatureValid(input: {
	signature: string | null;
	requestId: string | null;
	dataId: string;
	secret: string;
}): boolean {
	if (
		!input.secret ||
		!input.signature ||
		input.signature.length > 512 ||
		!input.requestId ||
		!/^[A-Za-z0-9_-]{1,128}$/.test(input.requestId) ||
		!/^[A-Za-z0-9_-]{1,128}$/.test(input.dataId)
	)
		return false;
	const fields = input.signature.split(',').map((part) => part.trim());
	const ts = fields.filter((part) => part.startsWith('ts='));
	const v1 = fields.filter((part) => part.startsWith('v1='));
	if (ts.length !== 1 || v1.length !== 1 || !/^ts=\d{1,16}$/.test(ts[0]!) || !/^v1=[a-fA-F0-9]{64}$/.test(v1[0]!))
		return false;
	const manifest = `id:${input.dataId.toLowerCase()};request-id:${input.requestId};ts:${ts[0]!.slice(3)};`;
	const expected = createHmac('sha256', input.secret).update(manifest).digest();
	return timingSafeEqual(expected, Buffer.from(v1[0]!.slice(3), 'hex'));
}

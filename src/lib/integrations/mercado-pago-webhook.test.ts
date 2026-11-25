import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { isMercadoPagoWebhookSignatureValid } from './mercado-pago-webhook';

const ts = '1795610000000';
const secret = 'fake-test-secret';
const dataId = 'ORD123';
const requestId = 'req-123';
const digest = createHmac('sha256', secret).update(`id:ord123;request-id:${requestId};ts:${ts};`).digest('hex');
const input = { signature: `ts=${ts},v1=${digest}`, requestId, dataId, secret };

describe('assinatura do webhook', () => {
	it('aceita manifest válido e normaliza o ID', () => expect(isMercadoPagoWebhookSignatureValid(input)).toBe(true));
	it.each([
		{ secret: 'wrong' },
		{ requestId: 'other' },
		{ dataId: 'ORD999' },
		{ requestId: null },
		{ signature: null },
		{ signature: `ts=${ts},v1=abc` },
		{ signature: `${input.signature},v1=${digest}` },
		{ signature: `${input.signature},ts=${ts}` },
		{ signature: `ts=invalid,v1=${digest}` },
		{ dataId: '../order' },
	])('rejeita alteração ou header inválido: %j', (patch) =>
		expect(isMercadoPagoWebhookSignatureValid({ ...input, ...patch })).toBe(false),
	);
});

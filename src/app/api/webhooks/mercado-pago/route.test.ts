import { createHmac } from 'node:crypto';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const mocks = vi.hoisted(() => ({ reconcile: vi.fn(), config: vi.fn() }));
vi.mock('@/server/payments/reconciliation.service', () => ({ reconcileMercadoPagoOrder: mocks.reconcile }));
vi.mock('@/lib/integrations/mercado-pago-config', () => ({ getMercadoPagoConfig: mocks.config }));
const secret = 'mock-secret';
const signature =
	'ts=123,v1=' + createHmac('sha256', secret).update('id:ord123;request-id:req-123;ts:123;').digest('hex');
function request(query = 'data.id=ORD123&type=order', signed = true) {
	return new NextRequest(`http://localhost/api/webhooks/mercado-pago?${query}`, {
		method: 'POST',
		headers: { 'x-signature': signed ? signature : 'bad', 'x-request-id': 'req-123' },
		body: JSON.stringify({ status: 'approved', live_mode: true, data: { id: 'FAKE' } }),
	});
}

beforeEach(() => {
	mocks.config.mockReturnValue({ webhookSecret: secret });
	mocks.reconcile.mockResolvedValue(undefined);
});
describe('webhook Mercado Pago', () => {
	it('usa somente ID assinado e ignora status/ID do corpo', async () => {
		expect((await POST(request())).status).toBe(200);
		expect(mocks.reconcile).toHaveBeenCalledWith('ORD123');
	});
	it('rejeita assinatura inválida antes de consultar API', async () => {
		expect((await POST(request(undefined, false))).status).toBe(401);
		expect(mocks.reconcile).not.toHaveBeenCalled();
	});
	it('rejeita IDs duplicados', async () => {
		expect((await POST(request('data.id=ORD123&data.id=OTHER&type=order'))).status).toBe(400);
		expect(mocks.reconcile).not.toHaveBeenCalled();
	});
	it('ignora outros tópicos assinados', async () => {
		expect((await POST(request('data.id=ORD123&type=payment'))).status).toBe(200);
		expect(mocks.reconcile).not.toHaveBeenCalled();
	});
	it('retorna erro recuperável quando conciliação falha', async () => {
		mocks.reconcile.mockRejectedValueOnce(new Error('sensitive details'));
		const response = await POST(request());
		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ received: false });
	});
	it('não chama API se configuração estiver ausente', async () => {
		mocks.config.mockImplementationOnce(() => {
			throw new Error('missing');
		});
		expect((await POST(request())).status).toBe(500);
		expect(mocks.reconcile).not.toHaveBeenCalled();
	});
});

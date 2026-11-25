import { NextRequest, NextResponse } from 'next/server';
import { getMercadoPagoConfig } from '@/lib/integrations/mercado-pago-config';
import { isMercadoPagoWebhookSignatureValid } from '@/lib/integrations/mercado-pago-webhook';
import { reconcileMercadoPagoOrder } from '@/server/payments/reconciliation.service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
	const query = request.nextUrl.searchParams;
	const ids = query.getAll('data.id');
	if (ids.length !== 1 || !/^[A-Za-z0-9_-]{1,128}$/.test(ids[0]!))
		return NextResponse.json({ received: false }, { status: 400 });
	const dataId = ids[0]!;
	try {
		const { webhookSecret } = getMercadoPagoConfig();
		if (
			!isMercadoPagoWebhookSignatureValid({
				signature: request.headers.get('x-signature'),
				requestId: request.headers.get('x-request-id'),
				dataId,
				secret: webhookSecret,
			})
		)
			return NextResponse.json({ received: false }, { status: 401 });
		if (query.getAll('type').length !== 1 || query.get('type') !== 'order')
			return NextResponse.json({ received: true });
		// O corpo não é autenticado pelo manifest. Não usar seus valores para baixa ou escopo.
		await reconcileMercadoPagoOrder(dataId);
		return NextResponse.json({ received: true });
	} catch {
		// Sem payload, token, CPF, IDs ou mensagem do SDK nos logs/resposta.
		console.error('Falha na conciliação Mercado Pago.');
		return NextResponse.json({ received: false }, { status: 500 });
	}
}

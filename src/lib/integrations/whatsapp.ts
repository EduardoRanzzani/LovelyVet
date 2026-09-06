import {
	WhatsappPayload,
	whatsappPayloadSchema,
} from '@/api/schema/whatsapp.schema';

export const sendWhatsappMessageInternal = async (data: WhatsappPayload) => {
	const payload = whatsappPayloadSchema.parse(data);
	const apiUrl = process.env.EVOLUTION_API_URL;
	const apiKey = process.env.EVOLUTION_API_KEY;

	if (!apiUrl || !apiKey) {
		throw new Error('Configuração da Evolution API ausente');
	}

	const baseUrl = new URL(apiUrl);

	if (process.env.NODE_ENV === 'production' && baseUrl.protocol !== 'https:') {
		throw new Error('Evolution API deve utilizar HTTPS em produção');
	}

	const endpoint = new URL('/message/sendText/LovelyVet', baseUrl);

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			apikey: apiKey,
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		console.error(`Falha na Evolution API: HTTP ${response.status}`);
		throw new Error('Falha ao enviar mensagem pelo WhatsApp');
	}

	return response.json();
};

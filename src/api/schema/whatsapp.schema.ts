import z from 'zod';

export const whatsappPayloadSchema = z.object({
	number: z
		.string()
		.trim()
		.regex(/^\d{10,15}$/, 'Número de WhatsApp inválido'),
	text: z.string().trim().min(1).max(4000),
	delay: z.number().int().min(0).max(5000).optional(),
	linkPreview: z.boolean().optional(),
});

export type WhatsappPayload = z.infer<typeof whatsappPayloadSchema>;

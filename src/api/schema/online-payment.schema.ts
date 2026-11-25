import { z } from 'zod';

const identification = z.discriminatedUnion('type', [
	z.object({ type: z.literal('CPF'), number: z.string().regex(/^\d{11}$/) }).strict(),
	z.object({ type: z.literal('CNPJ'), number: z.string().regex(/^\d{14}$/) }).strict(),
]);

// Somente token do Brick; nunca PAN, CVV, valor, ambiente ou identidade do tutor.
export const onlinePaymentSchema = z.discriminatedUnion('method', [
	z.object({ chargeId: z.uuid(), method: z.literal('pix') }).strict(),
	z
		.object({
			chargeId: z.uuid(),
			method: z.literal('credit_card'),
			token: z
				.string()
				.min(1)
				.max(512)
				.regex(/^[A-Za-z0-9_-]+$/),
			paymentMethodId: z.string().regex(/^[a-z0-9_]{1,64}$/),
			installments: z.number().int().min(1).max(24),
			identification: identification.optional(),
		})
		.strict(),
]);

export type OnlinePaymentInput = z.infer<typeof onlinePaymentSchema>;

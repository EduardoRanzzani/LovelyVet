import { z } from 'zod';

const identification = z.discriminatedUnion('type', [
	z.object({ type: z.literal('CPF'), number: z.string().regex(/^\d{11}$/) }).strict(),
	z.object({ type: z.literal('CNPJ'), number: z.string().regex(/^\d{14}$/) }).strict(),
]);

// Identificador antifraude opcional, nunca utilizado para autorização.
export const mercadoPagoDeviceIdSchema = z
	.string()
	.min(1)
	.max(512)
	.regex(/^[A-Za-z0-9._~+=/-]+$/);

// Saldo esperado é precondição; valor solicitado será validado sob lock.
// Não aceitar PAN, CVV, ambiente ou identidade do tutor.
const cents = z.number().int().positive().max(2147483647);
export const onlinePaymentSchema = z
	.discriminatedUnion('method', [
		z
			.object({
				chargeId: z.uuid(),
				deviceId: mercadoPagoDeviceIdSchema.optional(),
				method: z.literal('pix'),
				amountInCents: cents.optional(),
				expectedBalanceInCents: cents.optional(),
			})
			.strict(),
		z
			.object({
				chargeId: z.uuid(),
				deviceId: mercadoPagoDeviceIdSchema.optional(),
				method: z.literal('credit_card'),
				expectedBalanceInCents: cents,
				amountInCents: cents.optional(),
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
	])
	.superRefine((input, ctx) => {
		if (
			input.amountInCents !== undefined &&
			(input.expectedBalanceInCents === undefined || input.amountInCents > input.expectedBalanceInCents)
		) {
			ctx.addIssue({
				code: 'custom',
				path: ['amountInCents'],
				message: 'Informe valor positivo dentro do saldo esperado.',
			});
		}
	});

export type OnlinePaymentInput = z.infer<typeof onlinePaymentSchema>;

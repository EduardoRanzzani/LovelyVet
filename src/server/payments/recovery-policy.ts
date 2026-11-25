import 'server-only';
import { z } from 'zod';

const idSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
const searchResult = z.object({
	data: z.array(z.object({ id: idSchema, external_reference: z.string() })),
	paging: z.object({ total: z.union([z.literal(1), z.literal('1')]) }),
});

// Uma busca vazia, paginada ou ambígua não é prova de inexistência da Order.
export function findUniqueRecoveryOrder(raw: unknown, attemptId: string): string | null {
	const result = searchResult.safeParse(raw);
	if (!result.success || result.data.data.length !== 1) return null;
	const order = result.data.data[0]!;
	return order.external_reference === attemptId ? order.id : null;
}

export function getRecoverySearchOptions(attemptId: string, createdAt: Date, now: Date) {
	const start = createdAt.getTime() - 5 * 60_000;
	const end = Math.min(now.getTime(), start + 29 * 24 * 60 * 60_000);
	if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end || createdAt > now) return null;
	return {
		begin_date: new Date(start).toISOString(),
		end_date: new Date(end).toISOString(),
		external_reference: attemptId,
		type: 'online',
		page: 1,
		page_size: 2,
	};
}

const pixOrder = z.object({
	status: z.literal('action_required'),
	status_detail: z.literal('waiting_transfer'),
	total_paid_amount: z.literal('0.00'),
	transactions: z.object({
		payments: z
			.array(
				z.object({
					status: z.literal('action_required'),
					status_detail: z.literal('waiting_transfer'),
					paid_amount: z.literal('0.00').optional(),
					payment_method: z.object({
						id: z.literal('pix'),
						type: z.literal('bank_transfer'),
						qr_code: z
							.string()
							.min(1)
							.max(4096)
							.regex(/^[ -~]+$/),
						qr_code_base64: z
							.string()
							.max(400_000)
							.regex(/^[A-Za-z0-9+/]+={0,2}$/),
					}),
				}),
			)
			.length(1),
	}),
});

// Usar apenas após a política de conciliação validar identidade, método e valor.
// Não devolver ticket_url nem payload bruto; a UI deverá renderizar texto e PNG.
export function readPendingPix(raw: unknown) {
	const parsed = pixOrder.safeParse(raw);
	if (!parsed.success) return null;
	const method = parsed.data.transactions.payments[0]!.payment_method;
	const image = Buffer.from(method.qr_code_base64, 'base64');
	if (
		image.toString('base64') !== method.qr_code_base64 ||
		image.length < 24 ||
		image.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a'
	)
		return null;
	return { code: method.qr_code, pngBase64: method.qr_code_base64 };
}

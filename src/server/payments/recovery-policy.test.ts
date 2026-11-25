import { describe, expect, it } from 'vitest';
import { findUniqueRecoveryOrder, getRecoverySearchOptions, readPendingPix } from './recovery-policy';

const ref = 'c943e3cd-d2bb-4c19-a386-5a8e56899128';
const order = { id: 'ORD123', external_reference: ref };
const png = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.alloc(16)]).toString('base64');
const method = { id: 'pix', type: 'bank_transfer', qr_code: '000201TESTE', qr_code_base64: png };
const payment = { status: 'action_required', status_detail: 'waiting_transfer', payment_method: method };
const raw = {
	status: 'action_required',
	status_detail: 'waiting_transfer',
	total_paid_amount: '0.00',
	transactions: { payments: [payment] },
};

describe('recuperação por referência', () => {
	it.each([1, '1'])('aceita uma única Order com total %s', (total) =>
		expect(findUniqueRecoveryOrder({ data: [order], paging: { total } }, ref)).toBe('ORD123'),
	);
	it.each([
		{ data: [], paging: { total: 0 } },
		{ data: [order, order], paging: { total: 2 } },
		{ data: [order], paging: { total: 2 } },
		{ data: [order] },
		{ data: [{ ...order, external_reference: 'other' }], paging: { total: 1 } },
		{ data: [{ ...order, id: '../x' }], paging: { total: 1 } },
	])('não escolhe Order quando a busca é inconclusiva (%j)', (response) =>
		expect(findUniqueRecoveryOrder(response, ref)).toBeNull(),
	);
	it('usa referência exata e intervalo válido', () => {
		const options = getRecoverySearchOptions(
			ref,
			new Date('2026-11-25T12:00:00Z'),
			new Date('2026-11-25T12:10:00Z'),
		);
		expect(options).toEqual({
			begin_date: '2026-11-25T11:55:00.000Z',
			end_date: '2026-11-25T12:10:00.000Z',
			external_reference: ref,
			type: 'online',
			page: 1,
			page_size: 2,
		});
	});
	it('limita período a 29 dias', () => {
		const options = getRecoverySearchOptions(
			ref,
			new Date('2026-01-01T00:05:00Z'),
			new Date('2026-03-01T00:00:00Z'),
		);
		expect(options?.end_date).toBe('2026-01-30T00:00:00.000Z');
	});
	it('recusa data futura ou inválida', () => {
		const now = new Date('2026-11-25T12:00:00Z');
		expect(getRecoverySearchOptions(ref, new Date('2026-11-26'), now)).toBeNull();
		expect(getRecoverySearchOptions(ref, new Date('invalid'), now)).toBeNull();
	});
});

describe('dados Pix minimizados', () => {
	it('retorna somente código e PNG', () =>
		expect(
			readPendingPix({
				...raw,
				payer: { email: 'private' },
				transactions: {
					payments: [{ ...payment, payment_method: { ...method, ticket_url: 'https://example.invalid' } }],
				},
			}),
		).toEqual({ code: method.qr_code, pngBase64: png }));
	it.each([
		{ ...raw, status: 'processed' },
		{ ...raw, total_paid_amount: '150.00' },
		{ ...raw, transactions: { payments: [{ ...payment, paid_amount: '150.00' }] } },
		{
			...raw,
			transactions: { payments: [{ ...payment, payment_method: { ...method, qr_code_base64: 'PHN2Zz4=' } }] },
		},
		{ ...raw, transactions: { payments: [{ ...payment, payment_method: { ...method, qr_code: '<script>\n' } }] } },
		{ ...raw, transactions: { payments: [payment, payment] } },
	])('não retorna Pix inválido (%j)', (response) => expect(readPendingPix(response)).toBeNull());
});

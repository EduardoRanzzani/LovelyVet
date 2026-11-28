import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import type { AuthContext } from '@/lib/security/auth-context';
import { getOwnOnlineReceipt, getOwnOnlineReceiptLinks } from './online-payment-receipts';
import { PAYMENT_TEST_PET_ID } from './online-payment-scope';
const mocks = vi.hoisted(() => ({ where: vi.fn(), join: vi.fn(), config: vi.fn() }));
const chain = {
	from: () => chain,
	innerJoin: (...args: [unknown, unknown]) => {
		mocks.join(args[1]);
		return chain;
	},
	where: mocks.where,
};
vi.mock('@/db', async () => {
	const { QueryBuilder } = await import('drizzle-orm/pg-core');
	return {
		db: {
			select: (selection: Record<string, never>) =>
				'petId' in selection ? new QueryBuilder().select(selection) : chain,
		},
	};
});
vi.mock('@/lib/integrations/mercado-pago-config', () => ({ getMercadoPagoConfig: mocks.config }));
const context: AuthContext = {
	role: 'customer',
	userId: 'user-a',
	clerkUserId: 'clerk',
	customerId: 'tutor-a',
	doctorId: null,
};
beforeEach(() => {
	vi.resetAllMocks();
	mocks.config.mockReturnValue({ environment: 'test', collectorId: '123' });
	mocks.where.mockResolvedValue([]);
});
const dialect = new PgDialect();
const compiled = () => dialect.sqlToQuery(mocks.where.mock.calls[0][0] as SQL);
describe('consultas de comprovante próprio', () => {
	it('restringe links por iniciador, vínculo, ambiente, coletor e aprovação', async () => {
		await getOwnOnlineReceiptLinks(context, ['charge-a']);
		const result = compiled();
		expect(result.params).toEqual(
			expect.arrayContaining(['user-a', 'tutor-a', 'test', '123', 'approved', PAYMENT_TEST_PET_ID, 'charge-a']),
		);
		expect(result.sql).toContain('initiated_by');
		expect(result.sql).toContain('customer_id');
		const join = dialect.sqlToQuery(mocks.join.mock.calls[0][0] as SQL);
		for (const field of ['operation_key', 'online_payment_attempt_id', 'amount_in_cents', 'method', 'charge_id'])
			expect(join.sql).toContain(field);
		expect(join.params).toContain('mercado_pago');
	});
	it('restringe consulta direta pelos dois IDs e retorna null sem recebimento autorizado', async () => {
		expect(await getOwnOnlineReceipt(context, 'charge-a', 'attempt-a')).toBeNull();
		expect(compiled().params).toEqual(expect.arrayContaining(['charge-a', 'attempt-a', 'user-a', 'approved']));
	});
	it('não consulta dados sem configuração válida', async () => {
		mocks.config.mockImplementation(() => {
			throw new Error('invalid config');
		});
		expect(await getOwnOnlineReceipt(context, 'charge-a', 'attempt-a')).toBeNull();
		expect((await getOwnOnlineReceiptLinks(context, ['charge-a'])).size).toBe(0);
		expect(mocks.where).not.toHaveBeenCalled();
	});
	it('rejeita perfil de equipe antes de consultar', async () => {
		await expect(getOwnOnlineReceipt({ ...context, role: 'admin' }, 'charge-a', 'attempt-a')).rejects.toThrow();
		expect(mocks.where).not.toHaveBeenCalled();
	});
	it('retorna snapshot aprovado com saldo atual sem alterar recebimento', async () => {
		mocks.where.mockResolvedValue([
			{
				amountInCents: 8000,
				method: 'credit_card',
				installments: 2,
				providerPaidAmountInCents: 8772,
				totalInCents: 20000,
				paidInCents: 8000,
				receivedAt: new Date('2026-11-27T14:13:54Z'),
				receipts: [],
			},
		]);
		expect(await getOwnOnlineReceipt(context, 'charge-a', 'attempt-a')).toMatchObject({
			testMode: true,
			payment: {
				status: 'approved',
				balanceInCents: 12000,
				confirmation: { providerPaidAmountInCents: 8772 },
				pix: null,
			},
		});
	});
});

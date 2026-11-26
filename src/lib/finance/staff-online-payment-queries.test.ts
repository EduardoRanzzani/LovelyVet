import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { AuthContext } from '@/lib/security/auth-context';
import { getStaffOnlinePaymentAttempts } from './staff-online-payment-queries';

const mocks = vi.hoisted(() => ({ where: vi.fn(), orderBy: vi.fn(), config: vi.fn() }));
const chain = { from: () => chain, innerJoin: () => chain, where: mocks.where, orderBy: mocks.orderBy };
vi.mock('@/db', () => ({ db: { select: () => chain } }));
vi.mock('@/lib/integrations/mercado-pago-config', () => ({ getMercadoPagoConfig: mocks.config }));
const context: AuthContext = {
	role: 'doctor',
	userId: 'u',
	clerkUserId: 'clerk',
	doctorId: 'doctor-1',
	customerId: null,
};
const id = 'c943e3cd-d2bb-4c19-a386-5a8e56899128';
const row = {
	id,
	chargeId: 'charge',
	amountInCents: 20000,
	method: 'pix',
	installments: 1,
	status: 'pending',
	createdAt: new Date('2026-11-25T12:00:00Z'),
	updatedAt: new Date('2026-11-25T12:01:00Z'),
	expiresAt: null,
	reconciliationReason: null,
	providerOrderId: undefined,
};

beforeEach(() => {
	vi.resetAllMocks();
	mocks.config.mockReturnValue({ environment: 'test', collectorId: '123' });
	mocks.where.mockReturnValue(chain);
	mocks.orderBy.mockResolvedValue([row]);
});

describe('consulta autorizada das tentativas da equipe', () => {
	it('nega o perfil Customer antes de configurar ou consultar o banco', async () => {
		await expect(getStaffOnlinePaymentAttempts({ ...context, role: 'customer' }, ['charge'])).rejects.toThrow(
			'não autorizado',
		);
		expect(mocks.config).not.toHaveBeenCalled();
		expect(mocks.where).not.toHaveBeenCalled();
	});
	it('não consulta banco nem provedor se não há cobranças', async () => {
		expect(await getStaffOnlinePaymentAttempts(context, [])).toEqual([]);
		expect(mocks.config).not.toHaveBeenCalled();
	});
	it('mantém o financeiro manual quando a configuração do provedor falta', async () => {
		mocks.config.mockImplementation(() => {
			throw new Error('segredo');
		});
		expect(await getStaffOnlinePaymentAttempts(context, ['charge'])).toEqual([]);
		expect(mocks.where).not.toHaveBeenCalled();
	});
	it('filtra cobrança, ambiente, recebedor e atendimento da veterinária no SQL', async () => {
		const result = await getStaffOnlinePaymentAttempts(context, ['charge', 'charge']);
		const fragment = mocks.where.mock.calls[0][0];
		const query = new PgDialect().sqlToQuery(fragment);
		expect(query.sql).toContain('"appointments"."doctor_id"');
		expect(query.sql).toContain('"online_payment_attempts"."charge_id"');
		expect(query.sql).toContain('"online_payment_attempts"."environment"');
		expect(query.sql).toContain('"online_payment_attempts"."collector_id"');
		expect(query.params).toContain('doctor-1');
		expect(query.params).toContain('test');
		expect(query.params).toContain('123');
		expect(query.params.filter((item) => item === 'charge')).toHaveLength(1);
		expect(result).toEqual([
			{
				id,
				chargeId: 'charge',
				amountInCents: 20000,
				method: 'pix',
				installments: 1,
				status: 'pending',
				createdAt: '2026-11-25T12:00:00.000Z',
				updatedAt: '2026-11-25T12:01:00.000Z',
				expiresAt: null,
				reconciliationReason: null,
				providerOrderId: undefined,
			},
		]);
	});
	it('permite Admin sem restringir pela veterinária', async () => {
		await getStaffOnlinePaymentAttempts({ ...context, role: 'admin', doctorId: null }, ['charge']);
		const query = new PgDialect().sqlToQuery(mocks.where.mock.calls[0][0]);
		expect(query.sql).not.toContain('"appointments"."doctor_id"');
	});
	it('nega Doctor sem vínculo de perfil', async () => {
		await expect(getStaffOnlinePaymentAttempts({ ...context, doctorId: null }, ['charge'])).rejects.toThrow(
			'veterinário',
		);
	});
});

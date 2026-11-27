import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthContext } from '@/lib/security/auth-context';
import { PAYMENT_TEST_PET_ID } from './online-payment-scope';
import { getOwnOnlinePaymentOptions } from './online-payment-options';

const mocks = vi.hoisted(() => ({ where: vi.fn(), config: vi.fn(), enabled: vi.fn(), ready: vi.fn() }));
const chain = { from: () => chain, innerJoin: () => chain, where: mocks.where };
vi.mock('@/db', () => ({ db: { select: () => chain } }));
vi.mock('@/lib/finance/financial-access', async (importOriginal) => ({
	...(await importOriginal<typeof import('@/lib/finance/financial-access')>()),
	buildFinancialAccessCondition: () => undefined,
}));
vi.mock('@/lib/integrations/mercado-pago-config', () => ({
	getMercadoPagoConfig: mocks.config,
	isMercadoPagoEnabled: mocks.enabled,
}));
vi.mock('@/server/payments/payment.service', () => ({ assertOnlinePaymentReleaseReady: mocks.ready }));

const context: AuthContext = {
	role: 'customer',
	userId: 'user-a',
	clerkUserId: 'clerk',
	customerId: 'tutor-a',
	doctorId: null,
};
const charge = { id: 'charge', status: 'open', balanceInCents: 0 };
const scopedRow = { chargeId: charge.id, petId: PAYMENT_TEST_PET_ID, appointmentStatus: 'completed' };
const approved = {
	id: 'attempt',
	chargeId: charge.id,
	initiatedBy: context.userId,
	status: 'approved',
	inScope: true,
	hasReceipt: true,
};
const rejected = { ...approved, id: 'previous', status: 'rejected' };

beforeEach(() => {
	vi.resetAllMocks();
	mocks.config.mockReturnValue({ environment: 'test', collectorId: 'collector-test' });
	mocks.enabled.mockReturnValue(true);
	mocks.where.mockResolvedValueOnce([scopedRow]).mockResolvedValueOnce([approved, rejected]);
});

describe('opções do checkout individual', () => {
	it('preserva a listagem sem botão de pagamento para uma cobrança quitada', async () => {
		expect((await getOwnOnlinePaymentOptions(context, [charge])).size).toBe(0);
	});
	it('permite consultar a própria aprovação apenas no checkout e nunca iniciar outra tentativa', async () => {
		const result = await getOwnOnlinePaymentOptions(context, [charge], true);
		expect(result.get(charge.id)).toEqual({ canStart: false, attemptId: approved.id, testMode: true });
	});
	it('não expõe a confirmação de outro tutor vinculado à mesma cobrança', async () => {
		const other = { ...context, userId: 'user-b', customerId: 'tutor-b' };
		expect((await getOwnOnlinePaymentOptions(other, [charge], true)).size).toBe(0);
	});
	it('não escolhe uma aprovação arbitrária quando há mais de uma tentativa bloqueante', async () => {
		mocks.where
			.mockReset()
			.mockResolvedValueOnce([scopedRow])
			.mockResolvedValueOnce([
				approved,
				{ ...approved, id: 'another', status: 'review', inScope: false, hasReceipt: false },
			]);
		expect((await getOwnOnlinePaymentOptions(context, [charge], true)).size).toBe(0);
	});
	it('permite nova tentativa quando aprovação conciliada ainda deixa saldo em aberto', async () => {
		const result = await getOwnOnlinePaymentOptions(context, [{ ...charge, balanceInCents: 5000 }], true);
		expect(result.get(charge.id)).toEqual({ canStart: true, attemptId: null, testMode: true });
	});
	it('não consulta tentativas de um pet real no ambiente de teste', async () => {
		mocks.where.mockReset().mockResolvedValueOnce([{ ...scopedRow, petId: 'other' }]);
		expect((await getOwnOnlinePaymentOptions(context, [charge], true)).size).toBe(0);
		expect(mocks.where).toHaveBeenCalledOnce();
	});
	it('continua liberando criação apenas após recusas definitivas e saldo elegível', async () => {
		mocks.where.mockReset().mockResolvedValueOnce([scopedRow]).mockResolvedValueOnce([rejected]);
		const result = await getOwnOnlinePaymentOptions(context, [{ ...charge, balanceInCents: 20000 }], true);
		expect(result.get(charge.id)).toEqual({ canStart: true, attemptId: null, testMode: true });
	});
	it('permite consultar a própria aprovação mesmo com a criação desabilitada', async () => {
		mocks.enabled.mockReturnValue(false);
		const result = await getOwnOnlinePaymentOptions(context, [charge], true);
		expect(result.get(charge.id)).toEqual({ canStart: false, attemptId: approved.id, testMode: true });
	});
	it('bloqueia aprovação sem recebimento, mesmo com saldo', async () => {
		mocks.where
			.mockReset()
			.mockResolvedValueOnce([scopedRow])
			.mockResolvedValueOnce([{ ...approved, hasReceipt: false }]);
		expect(
			(await getOwnOnlinePaymentOptions(context, [{ ...charge, balanceInCents: 10000 }], true)).get(charge.id),
		).toEqual({ canStart: false, attemptId: null, testMode: true });
	});
	it('bloqueia tentativa ativa fora do escopo sem expor seu ID', async () => {
		mocks.where
			.mockReset()
			.mockResolvedValueOnce([scopedRow])
			.mockResolvedValueOnce([{ ...approved, status: 'pending', inScope: false, hasReceipt: false }]);
		expect(
			(await getOwnOnlinePaymentOptions(context, [{ ...charge, balanceInCents: 10000 }], true)).get(charge.id),
		).toEqual({ canStart: false, attemptId: null, testMode: true });
	});
});

it('recupera a aprovação própria mais recente em cobrança quitada por múltiplas operações', async () => {
	mocks.where
		.mockReset()
		.mockResolvedValueOnce([scopedRow])
		.mockResolvedValueOnce([
			{ ...approved, approvedAt: new Date('2026-11-25') },
			{ ...approved, id: 'latest', approvedAt: new Date('2026-11-26') },
			{ ...approved, id: 'other', initiatedBy: 'other', approvedAt: new Date('2026-11-27') },
		]);
	expect((await getOwnOnlinePaymentOptions(context, [charge], true)).get(charge.id)).toEqual({
		canStart: false,
		attemptId: 'latest',
		testMode: true,
	});
});

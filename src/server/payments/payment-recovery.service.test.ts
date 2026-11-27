import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthContext } from '@/lib/security/auth-context';
import { PAYMENT_TEST_PET_ID } from '@/lib/finance/online-payment-scope';
import { refreshOnlinePayment } from './payment-recovery.service';

const mocks = vi.hoisted(() => ({
	transaction: vi.fn(),
	where: vi.fn(),
	lock: vi.fn(),
	claim: vi.fn(),
	search: vi.fn(),
	reconcile: vi.fn(),
	config: vi.fn(),
}));
const chain = { from: () => chain, innerJoin: () => chain, where: mocks.where };
vi.mock('@/db', () => ({ db: { transaction: mocks.transaction, select: () => chain } }));
vi.mock('@/lib/finance/financial-access', async (importOriginal) => ({
	...(await importOriginal<typeof import('@/lib/finance/financial-access')>()),
	buildFinancialAccessCondition: () => undefined,
}));
vi.mock('@/lib/security/appointment-access', () => ({ lockAccessibleAppointment: mocks.lock }));
vi.mock('@/lib/integrations/mercado-pago-config', () => ({ getMercadoPagoConfig: mocks.config }));
vi.mock('@/lib/integrations/mercado-pago', () => ({ getMercadoPagoOrderClient: () => ({ search: mocks.search }) }));
vi.mock('./reconciliation.service', () => ({ reconcileMercadoPagoOrder: mocks.reconcile }));
const id = 'c943e3cd-d2bb-4c19-a386-5a8e56899128';
const context: AuthContext = {
	role: 'customer',
	customerId: 'customer',
	userId: 'user',
	doctorId: null,
	clerkUserId: 'clerk',
};
const attempt = {
	id,
	status: 'processing',
	method: 'pix',
	amountInCents: 15000,
	providerOrderId: 'ORD123',
	providerPaymentId: 'PAY123',
	createdAt: new Date('2026-11-25T12:00:00Z'),
};
const row = { attempt, appointmentId: 'appointment', petId: PAYMENT_TEST_PET_ID };
const pending = { ...row, attempt: { ...attempt, status: 'pending' } };
const pix = { code: '000201TESTE', pngBase64: 'png' };

beforeEach(() => {
	vi.resetAllMocks();
	mocks.config.mockReturnValue({ environment: 'test', collectorId: '123' });
	mocks.claim.mockResolvedValue([{ id }]);
	mocks.reconcile.mockResolvedValue({ orderId: 'ORD123', paymentId: 'PAY123', pix });
	mocks.where.mockResolvedValueOnce([row]).mockResolvedValueOnce([row]).mockResolvedValueOnce([pending]);
	const tx = { select: () => chain, update: () => ({ set: () => ({ where: () => ({ returning: mocks.claim }) }) }) };
	mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback(tx));
});

describe('sincronização ativa', () => {
	it('nega equipe antes de acessar configuração ou banco', async () => {
		await expect(refreshOnlinePayment({ ...context, role: 'admin' }, id)).rejects.toThrow('não autorizado');
		expect(mocks.config).not.toHaveBeenCalled();
		expect(mocks.transaction).not.toHaveBeenCalled();
	});
	it('nega tentativa fora da consulta autorizada sem chamar o provedor', async () => {
		mocks.where.mockReset().mockResolvedValueOnce([]);
		await expect(refreshOnlinePayment(context, id)).rejects.toThrow('Tentativa não encontrada');
		expect(mocks.reconcile).not.toHaveBeenCalled();
		expect(mocks.search).not.toHaveBeenCalled();
	});
	it('nega pet real no modo teste', async () => {
		mocks.where
			.mockReset()
			.mockResolvedValueOnce([row])
			.mockResolvedValueOnce([{ ...row, petId: 'other' }]);
		await expect(refreshOnlinePayment(context, id)).rejects.toThrow('homologação');
		expect(mocks.claim).not.toHaveBeenCalled();
	});
	it('usa ID conhecido, reautoriza e retorna Pix quando ainda pendente', async () => {
		await expect(refreshOnlinePayment(context, id)).resolves.toEqual({
			attemptId: id,
			status: 'pending',
			amountInCents: 15000,
			pix,
			remoteUnavailable: false,
			retryAfterSeconds: 15,
		});
		expect(mocks.lock).toHaveBeenCalledOnce();
		expect(mocks.reconcile).toHaveBeenCalledWith('ORD123', id);
		expect(mocks.search).not.toHaveBeenCalled();
	});
	it('gera PNG local quando o provedor retorna apenas o código', async () => {
		mocks.reconcile.mockResolvedValue({ orderId: 'ORD123', paymentId: 'PAY123', pix: { ...pix, pngBase64: null } });
		const result = await refreshOnlinePayment(context, id, true);
		expect(result.pix?.code).toBe(pix.code);
		expect(
			Buffer.from(result.pix?.pngBase64 ?? '', 'base64')
				.subarray(0, 8)
				.toString('hex'),
		).toBe('89504e470d0a1a0a');
	});
	it('preserva o código se a geração local falhar', async () => {
		const code = 'a'.repeat(4096);
		mocks.reconcile.mockResolvedValue({ orderId: 'ORD123', paymentId: 'PAY123', pix: { code, pngBase64: null } });
		expect(await refreshOnlinePayment(context, id)).toMatchObject({ pix: { code, pngBase64: null } });
	});
	it('não busca Order desconhecida na consulta inicial', async () => {
		const unknown = { ...row, attempt: { ...attempt, providerOrderId: null } };
		mocks.where
			.mockReset()
			.mockResolvedValueOnce([unknown])
			.mockResolvedValueOnce([unknown])
			.mockResolvedValueOnce([unknown]);
		expect(await refreshOnlinePayment(context, id, true)).toMatchObject({ pix: null });
		expect(mocks.claim).not.toHaveBeenCalled();
		expect(mocks.reconcile).not.toHaveBeenCalled();
		expect(mocks.search).not.toHaveBeenCalled();
	});
	it('respeita reserva de consulta concorrente', async () => {
		mocks.claim.mockResolvedValue([]);
		await expect(refreshOnlinePayment(context, id)).resolves.toMatchObject({ pix: null, remoteUnavailable: false });
		expect(mocks.reconcile).not.toHaveBeenCalled();
	});
	it('não expõe Pix se o vínculo foi removido durante a consulta', async () => {
		mocks.where.mockReset().mockResolvedValueOnce([row]).mockResolvedValueOnce([row]).mockResolvedValueOnce([]);
		await expect(refreshOnlinePayment(context, id)).rejects.toThrow('Tentativa não encontrada');
	});
	it('oculta Pix quando a tentativa já foi aprovada', async () => {
		mocks.where
			.mockReset()
			.mockResolvedValueOnce([row])
			.mockResolvedValueOnce([row])
			.mockResolvedValueOnce([{ ...row, attempt: { ...attempt, status: 'approved' } }]);
		await expect(refreshOnlinePayment(context, id)).resolves.toMatchObject({ status: 'approved', pix: null });
	});
	it('não propaga falha remota nem libera tentativa', async () => {
		mocks.reconcile.mockRejectedValue(new Error('payload privado'));
		mocks.where.mockReset().mockResolvedValueOnce([row]).mockResolvedValueOnce([row]).mockResolvedValueOnce([row]);
		await expect(refreshOnlinePayment(context, id)).resolves.toMatchObject({
			status: 'processing',
			pix: null,
			remoteUnavailable: true,
		});
	});
});

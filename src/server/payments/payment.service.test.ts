import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthContext } from '@/lib/security/auth-context';
import { PAYMENT_TEST_PET_ID } from '@/lib/finance/online-payment-scope';
import { assertOnlinePaymentReleaseReady, createOnlinePayment } from './payment.service';

const mocks = vi.hoisted(() => ({
	transaction: vi.fn(),
	config: vi.fn(),
	enabled: vi.fn(),
	client: vi.fn(),
	collector: vi.fn(),
	where: vi.fn(),
	lock: vi.fn(),
}));
const chain = { from: () => chain, innerJoin: () => chain, where: mocks.where };
vi.mock('@/db', () => ({ db: { transaction: mocks.transaction, select: () => chain } }));
vi.mock('@/lib/security/appointment-access', () => ({
	buildAppointmentAccessCondition: () => undefined,
	lockAccessibleAppointment: mocks.lock,
}));
vi.mock('@/lib/integrations/mercado-pago-config', () => ({
	assertMercadoPagoEnabled: mocks.enabled,
	getMercadoPagoConfig: mocks.config,
	assertMercadoPagoTestCollector: mocks.collector,
}));
vi.mock('@/lib/integrations/mercado-pago', () => ({
	getMercadoPagoOrderClient: mocks.client,
	formatMercadoPagoAmount: vi.fn(),
}));
const context: AuthContext = {
	role: 'customer',
	customerId: 'customer',
	userId: 'user',
	doctorId: null,
	clerkUserId: 'clerk',
};
const input = { chargeId: 'c943e3cd-d2bb-4c19-a386-5a8e56899128', method: 'pix' } as const;
const config = { environment: 'test', collectorId: '123', accessToken: 'fake', webhookSecret: 'fake' } as const;
const candidate = { appointmentId: 'appointment', petId: PAYMENT_TEST_PET_ID };

beforeEach(() => {
	vi.resetAllMocks();
	vi.stubEnv('NODE_ENV', 'development');
	mocks.config.mockReturnValue(config);
	mocks.where.mockResolvedValue([candidate]);
	mocks.collector.mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe('gate de criação de pagamentos', () => {
	it('rejeita perfil de equipe antes de consultar configuração', async () => {
		await expect(createOnlinePayment({ ...context, role: 'admin' }, input)).rejects.toThrow('não autorizado');
		expect(mocks.enabled).not.toHaveBeenCalled();
		expect(mocks.transaction).not.toHaveBeenCalled();
	});
	it('rejeita feature flag desligada sem abrir transação', async () => {
		mocks.enabled.mockImplementationOnce(() => {
			throw new Error('desabilitados');
		});
		await expect(createOnlinePayment(context, input)).rejects.toThrow('desabilitados');
		expect(mocks.transaction).not.toHaveBeenCalled();
		expect(mocks.client).not.toHaveBeenCalled();
	});
	it('bloqueia criação em ambiente de produção mesmo com flag habilitada', async () => {
		mocks.config.mockReturnValue({ ...config, environment: 'production' });
		await expect(createOnlinePayment(context, input)).rejects.toThrow('homologação local');
		expect(mocks.where).not.toHaveBeenCalled();
		expect(mocks.collector).not.toHaveBeenCalled();
		expect(mocks.transaction).not.toHaveBeenCalled();
	});
	it('bloqueia execução de build de produção mesmo com configuração teste', () => {
		vi.stubEnv('NODE_ENV', 'production');
		expect(() => assertOnlinePaymentReleaseReady('test')).toThrow('homologação local');
	});
	it('permite gate local somente em teste', () => {
		expect(() => assertOnlinePaymentReleaseReady('test')).not.toThrow();
	});
	it('nega cobrança alheia antes de consultar provedor', async () => {
		mocks.where.mockResolvedValue([]);
		await expect(createOnlinePayment(context, input)).rejects.toThrow('Cobrança não encontrada');
		expect(mocks.collector).not.toHaveBeenCalled();
		expect(mocks.transaction).not.toHaveBeenCalled();
	});
	it('nega pet real antes de consultar provedor', async () => {
		mocks.where.mockResolvedValue([{ ...candidate, petId: 'real' }]);
		await expect(createOnlinePayment(context, input)).rejects.toThrow('pet de homologação');
		expect(mocks.collector).not.toHaveBeenCalled();
		expect(mocks.transaction).not.toHaveBeenCalled();
	});
	it('falha remota não reserva tentativa nem inicializa cliente Orders', async () => {
		mocks.collector.mockRejectedValue(new Error('Conta incompatível'));
		await expect(createOnlinePayment(context, input)).rejects.toThrow('Conta incompatível');
		expect(mocks.transaction).not.toHaveBeenCalled();
		expect(mocks.client).not.toHaveBeenCalled();
	});
	it('valida recebedor antes da transação e revalida escopo sob lock', async () => {
		let verified = false;
		mocks.collector.mockImplementation(async () => {
			expect(mocks.transaction).not.toHaveBeenCalled();
			verified = true;
		});
		mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
			expect(verified).toBe(true);
			return callback({});
		});
		mocks.lock.mockResolvedValue({ id: candidate.appointmentId, petId: 'real' });
		await expect(createOnlinePayment(context, input)).rejects.toThrow('pet de homologação');
		expect(mocks.collector).toHaveBeenCalledWith(config);
		expect(mocks.lock).toHaveBeenCalledWith(expect.anything(), context, candidate.appointmentId);
	});
});

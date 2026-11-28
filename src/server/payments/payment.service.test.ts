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
	productionCollector: vi.fn(),
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
	assertMercadoPagoProductionCollector: mocks.productionCollector,
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
	vi.stubEnv('CLERK_ENVIRONMENT', 'development');
	vi.stubEnv('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'pk_test_fake');
	vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake');
	vi.stubEnv('MERCADO_PAGO_PRODUCTION_RELEASE_READY', undefined);
	vi.stubEnv('NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY', 'APP_USR-fake');
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
		await expect(createOnlinePayment(context, input)).rejects.toThrow('Ambientes de execução');
		expect(mocks.where).not.toHaveBeenCalled();
		expect(mocks.collector).not.toHaveBeenCalled();
		expect(mocks.transaction).not.toHaveBeenCalled();
	});
	it('bloqueia execução de build de produção mesmo com configuração teste', () => {
		vi.stubEnv('NODE_ENV', 'production');
		expect(() => assertOnlinePaymentReleaseReady('test')).toThrow('Ambientes de execução');
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

describe('liberação de produção', () => {
	beforeEach(() => {
		vi.stubEnv('NODE_ENV', 'production');
		vi.stubEnv('CLERK_ENVIRONMENT', 'production');
		vi.stubEnv('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'pk_live_fake');
		vi.stubEnv('CLERK_SECRET_KEY', 'sk_live_fake');
		mocks.config.mockReturnValue({ ...config, environment: 'production' });
		mocks.where.mockResolvedValue([{ ...candidate, petId: 'real' }]);
	});
	it.each([undefined, 'false', 'TRUE'])('mantém gate fechado: %s', (value) => {
		vi.stubEnv('MERCADO_PAGO_PRODUCTION_RELEASE_READY', value);
		expect(() => assertOnlinePaymentReleaseReady('production')).toThrow('não autorizada');
	});
	it('permite configuração de produção explicitamente autorizada', () => {
		vi.stubEnv('MERCADO_PAGO_PRODUCTION_RELEASE_READY', 'true');
		expect(() => assertOnlinePaymentReleaseReady('production')).not.toThrow();
	});
	it.each(['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'])('rejeita chave Clerk incorreta: %s', (key) => {
		vi.stubEnv('MERCADO_PAGO_PRODUCTION_RELEASE_READY', 'true');
		vi.stubEnv(key, 'test-key');
		expect(() => assertOnlinePaymentReleaseReady('production')).toThrow('Credenciais Clerk');
	});
	it('rejeita Public Key de teste', () => {
		vi.stubEnv('MERCADO_PAGO_PRODUCTION_RELEASE_READY', 'true');
		vi.stubEnv('NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY', 'TEST-fake');
		expect(() => assertOnlinePaymentReleaseReady('production')).toThrow('Public Key');
	});
	it('nega pet de teste antes de consultar recebedor real', async () => {
		vi.stubEnv('MERCADO_PAGO_PRODUCTION_RELEASE_READY', 'true');
		mocks.where.mockResolvedValue([candidate]);
		await expect(createOnlinePayment(context, input)).rejects.toThrow('pet de homologação');
		expect(mocks.productionCollector).not.toHaveBeenCalled();
		expect(mocks.transaction).not.toHaveBeenCalled();
	});
	it('falha de validação real não reserva nem cria Order', async () => {
		vi.stubEnv('MERCADO_PAGO_PRODUCTION_RELEASE_READY', 'true');
		mocks.productionCollector.mockRejectedValue(new Error('Conta incompatível'));
		await expect(createOnlinePayment(context, input)).rejects.toThrow('Conta incompatível');
		expect(mocks.collector).not.toHaveBeenCalled();
		expect(mocks.transaction).not.toHaveBeenCalled();
		expect(mocks.client).not.toHaveBeenCalled();
	});
});

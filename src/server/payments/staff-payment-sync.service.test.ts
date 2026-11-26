import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthContext } from '@/lib/security/auth-context';
import { PAYMENT_TEST_PET_ID } from '@/lib/finance/online-payment-scope';
import { syncStaffOnlinePayment } from './staff-payment-sync.service';

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
vi.mock('@/lib/security/appointment-access', () => ({
	lockAccessibleAppointment: mocks.lock,
	buildAppointmentAccessCondition: () => undefined,
}));
vi.mock('@/lib/integrations/mercado-pago-config', () => ({ getMercadoPagoConfig: mocks.config }));
vi.mock('@/lib/integrations/mercado-pago', () => ({ getMercadoPagoOrderClient: () => ({ search: mocks.search }) }));
vi.mock('./reconciliation.service', () => ({ reconcileMercadoPagoOrder: mocks.reconcile }));
const id = 'c943e3cd-d2bb-4c19-a386-5a8e56899128';
const context: AuthContext = {
	role: 'doctor',
	doctorId: 'doctor',
	customerId: null,
	userId: 'user',
	clerkUserId: 'clerk',
};
const attempt = {
	id,
	status: 'pending',
	method: 'pix',
	providerOrderId: 'ORD123',
	createdAt: new Date('2026-11-25T12:00:00Z'),
};
const row = { attempt, appointmentId: 'appointment', petId: PAYMENT_TEST_PET_ID };

beforeEach(() => {
	vi.resetAllMocks();
	mocks.config.mockReturnValue({ environment: 'test', collectorId: '123' });
	mocks.claim.mockResolvedValue([{ id }]);
	mocks.where.mockResolvedValueOnce([row]).mockResolvedValueOnce([row]).mockResolvedValueOnce([row]);
	mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
		const tx = {
			select: () => chain,
			update: () => ({ set: () => ({ where: () => ({ returning: mocks.claim }) }) }),
		};
		return callback(tx);
	});
});

describe('sincronização de pagamentos pela equipe', () => {
	it('nega Customer antes de acessar configurações ou banco', async () => {
		await expect(syncStaffOnlinePayment({ ...context, role: 'customer' }, id)).rejects.toThrow('não autorizado');
		expect(mocks.config).not.toHaveBeenCalled();
		expect(mocks.transaction).not.toHaveBeenCalled();
	});
	it('nega tentativa alheia e não consulta o Mercado Pago', async () => {
		mocks.where.mockReset().mockResolvedValueOnce([]);
		await expect(syncStaffOnlinePayment(context, id)).rejects.toThrow('Tentativa não encontrada');
		expect(mocks.lock).not.toHaveBeenCalled();
		expect(mocks.reconcile).not.toHaveBeenCalled();
	});
	it('revalida autorização sob lock e recusa pet fora do escopo de testes', async () => {
		mocks.where
			.mockReset()
			.mockResolvedValueOnce([row])
			.mockResolvedValueOnce([{ ...row, petId: 'real' }]);
		await expect(syncStaffOnlinePayment(context, id)).rejects.toThrow('homologação');
		expect(mocks.claim).not.toHaveBeenCalled();
		expect(mocks.lock).toHaveBeenCalledWith(expect.anything(), context, 'appointment');
	});
	it('sincroniza sem manter transação aberta durante acesso ao provedor', async () => {
		let active = false;
		mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
			active = true;
			const tx = {
				select: () => chain,
				update: () => ({ set: () => ({ where: () => ({ returning: mocks.claim }) }) }),
			};
			try {
				return await callback(tx);
			} finally {
				active = false;
			}
		});
		mocks.reconcile.mockImplementation(() => {
			expect(active).toBe(false);
		});
		const output = await syncStaffOnlinePayment(context, id);
		expect(output).toEqual({
			status: 'pending',
			remoteUnavailable: false,
			retryAfterSeconds: 15,
		});
		expect(mocks.reconcile).toHaveBeenCalledWith('ORD123', id);
		expect(output).not.toHaveProperty('pix');
	});
	it('protege consultas concorrentes com cooldown persistido', async () => {
		mocks.claim.mockResolvedValue([]);
		await expect(syncStaffOnlinePayment(context, id)).resolves.toMatchObject({ remoteUnavailable: false });
		expect(mocks.reconcile).not.toHaveBeenCalled();
	});
	it('consulta status final para identificar aprovação tardia sem baixa automática', async () => {
		mocks.where
			.mockReset()
			.mockResolvedValueOnce([{ ...row, attempt: { ...attempt, status: 'expired' } }])
			.mockResolvedValueOnce([{ ...row, attempt: { ...attempt, status: 'expired' } }])
			.mockResolvedValueOnce([
				{ ...row, attempt: { ...attempt, status: 'review', reconciliationReason: 'late_approval' } },
			]);
		await expect(syncStaffOnlinePayment(context, id)).resolves.toMatchObject({ status: 'review' });
		expect(mocks.reconcile).toHaveBeenCalledOnce();
	});
	it('não reprocessa tentativa em revisão humana', async () => {
		mocks.where
			.mockReset()
			.mockResolvedValueOnce([{ ...row, attempt: { ...attempt, status: 'review' } }])
			.mockResolvedValueOnce([{ ...row, attempt: { ...attempt, status: 'review' } }])
			.mockResolvedValueOnce([{ ...row, attempt: { ...attempt, status: 'review' } }]);
		await expect(syncStaffOnlinePayment(context, id)).resolves.toMatchObject({ status: 'review' });
		expect(mocks.claim).not.toHaveBeenCalled();
		expect(mocks.reconcile).not.toHaveBeenCalled();
	});
	it('oculta falhas remotas e mantém a tentativa bloqueada', async () => {
		mocks.reconcile.mockRejectedValue(new Error('segredo remoto'));
		await expect(syncStaffOnlinePayment(context, id)).resolves.toMatchObject({ remoteUnavailable: true });
	});
	it('nega informação quando o acesso é revogado durante a rede', async () => {
		mocks.where.mockReset().mockResolvedValueOnce([row]).mockResolvedValueOnce([row]).mockResolvedValueOnce([]);
		await expect(syncStaffOnlinePayment(context, id)).rejects.toThrow('Tentativa não encontrada');
	});
	it('não expõe dados Pix nem identificadores externos ao Admin', async () => {
		const result = await syncStaffOnlinePayment({ ...context, role: 'admin' }, id);
		expect(Object.keys(result)).toEqual(['status', 'remoteUnavailable', 'retryAfterSeconds']);
	});
});

import { describe, expect, it, vi } from 'vitest';
import type { AuthContext } from '@/lib/security/auth-context';
import { createOnlinePayment } from './payment.service';

const mocks = vi.hoisted(() => ({ transaction: vi.fn(), config: vi.fn(), enabled: vi.fn(), client: vi.fn() }));
vi.mock('@/db', () => ({ db: { transaction: mocks.transaction } }));
vi.mock('@/lib/integrations/mercado-pago-config', () => ({
	assertMercadoPagoEnabled: mocks.enabled,
	getMercadoPagoConfig: mocks.config,
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
	it('mesmo habilitado, bloqueia chamadas reais até conciliação', async () => {
		await expect(createOnlinePayment(context, input)).rejects.toThrow('ainda não liberada');
		expect(mocks.config).not.toHaveBeenCalled();
		expect(mocks.transaction).not.toHaveBeenCalled();
		expect(mocks.client).not.toHaveBeenCalled();
	});
});

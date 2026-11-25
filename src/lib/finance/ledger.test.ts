import { describe, expect, it } from 'vitest';
import {
	assertChargeableAppointment,
	assertTutorIsLinked,
	assertPaymentAmount,
	calculateChargeBalance,
} from './ledger';

describe('finance ledger (centavos)', () => {
	it('mostra cobrança pendente', () =>
		expect(calculateChargeBalance(24000, [])).toEqual({
			totalInCents: 24000,
			paidInCents: 0,
			balanceInCents: 24000,
			status: 'pending',
		}));
	it('aceita pagamento parcial', () =>
		expect(calculateChargeBalance(24000, [{ amountInCents: 10000 }]).status).toBe('partial'));
	it('fecha no pagamento integral', () =>
		expect(calculateChargeBalance(24000, [{ amountInCents: 10000 }, { amountInCents: 14000 }]).status).toBe(
			'paid',
		));
	it('rejeita pagamento além do saldo', () => expect(() => assertPaymentAmount(14000, 14001)).toThrow());
	it('rejeita valores nulos e fracionários', () => {
		expect(() => assertPaymentAmount(14000, 0)).toThrow();
		expect(() => assertPaymentAmount(14000, 2.5)).toThrow();
	});
	it('rejeita estorno por cancelamento de cobrança já paga', () =>
		expect(() => calculateChargeBalance(100, [{ amountInCents: 1 }], true)).toThrow());
	it('permite cancelamento sem pagamentos', () => expect(calculateChargeBalance(100, [], true).status).toBe('void'));
	it('somente atendimento realizado pode gerar cobrança', () => {
		expect(() =>
			assertChargeableAppointment({ status: 'pending', isPaid: false, totalPriceInCents: 100 }),
		).toThrow();
		expect(() =>
			assertChargeableAppointment({ status: 'completed', isPaid: true, totalPriceInCents: 100 }),
		).toThrow();
		expect(() =>
			assertChargeableAppointment({ status: 'completed', isPaid: false, totalPriceInCents: 100 }),
		).not.toThrow();
	});
	it('cobra somente tutor vinculado ao pet', () => {
		expect(() => assertTutorIsLinked([{ customerId: 'tutor-1' }], 'tutor-2')).toThrow();
		expect(() => assertTutorIsLinked([{ customerId: 'tutor-1' }], 'tutor-1')).not.toThrow();
	});
	it('protege contra estouro e totais inválidos', () => expect(() => calculateChargeBalance(-1, [])).toThrow());
});

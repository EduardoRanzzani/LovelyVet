import { describe, expect, it } from 'vitest';
import { formatPaymentInstallments } from './payment-installment-label';

describe('formatPaymentInstallments', () => {
	it.each([
		[2, 8772, '2x de R$ 43,86'],
		[3, 30000, '3x de R$ 100,00'],
		[3, 10000, '3x de aproximadamente R$ 33,33'],
		[3, 10001, '3x de aproximadamente R$ 33,34'],
		[2, null, '2x'],
		[1, 8772, 'À vista'],
		[2, -1, '2x'],
		[2, 0, '2x'],
		[2, 87.72, '2x'],
		[0, 8772, 'Não informado'],
	] as const)('formata %s parcelas com total %s', (installments, total, expected) => {
		expect(formatPaymentInstallments(installments, total).replace(/\u00a0/g, ' ')).toBe(expected);
	});
});

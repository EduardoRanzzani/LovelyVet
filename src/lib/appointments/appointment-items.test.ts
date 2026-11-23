import { describe, expect, it } from 'vitest';
import { totalForLine, totalForItems } from './appointment-items';
describe('valores históricos dos itens', () => {
	it('calcula quantidade e desconto em centavos', () => {
		expect(totalForLine({ quantity: 3, unitPriceInCents: 1250, discountInCents: 250 })).toBe(3500);
	});
	it('soma itens heterogêneos', () => {
		expect(totalForItems([{ quantity: 1, unitPriceInCents: 8500, discountInCents: 0 }, { quantity: 2, unitPriceInCents: 3000, discountInCents: 500 }])).toBe(14000);
	});
	it('rejeita total acima do limite inteiro do PostgreSQL', () => {
		expect(() => totalForItems([{ quantity: 999, unitPriceInCents: 100_000_000, discountInCents: 0 }])).toThrow('limite');
	});
	it('rejeita desconto excessivo e valores negativos', () => {
		expect(() => totalForLine({ quantity: 1, unitPriceInCents: 500, discountInCents: 501 })).toThrow();
		expect(() => totalForLine({ quantity: -1, unitPriceInCents: 500, discountInCents: 0 })).toThrow();
	});
});

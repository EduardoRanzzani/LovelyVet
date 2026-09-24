import { describe, expect, it } from 'vitest';

import { fromCents, toCents } from './currency';

describe('toCents', () => {
	it('converts reais to cents', () => {
		expect(toCents(800)).toBe(80000);
		expect(toCents(12.34)).toBe(1234);
	});

	it('rounds fractional cents', () => {
		expect(toCents(10.999)).toBe(1100);
		expect(toCents(10.994)).toBe(1099);
	});

	it('accepts zero', () => {
		expect(toCents(0)).toBe(0);
	});

	it('rejects negative values', () => {
		expect(() => toCents(-1)).toThrow(
			'O valor monetário não pode ser negativo.',
		);
	});

	it('rejects NaN', () => {
		expect(() => toCents(Number.NaN)).toThrow('Valor monetário inválido.');
	});

	it('rejects infinity', () => {
		expect(() => toCents(Number.POSITIVE_INFINITY)).toThrow(
			'Valor monetário inválido.',
		);
	});

	it('rejects values larger than the safe integer range', () => {
		expect(() => toCents(Number.MAX_SAFE_INTEGER)).toThrow(
			'Valor monetário excede o limite permitido.',
		);
	});
});

describe('fromCents', () => {
	it('converts cents to reais', () => {
		expect(fromCents(80000)).toBe(800);
		expect(fromCents(1234)).toBe(12.34);
	});

	it('accepts zero', () => {
		expect(fromCents(0)).toBe(0);
	});

	it('rejects fractional cents', () => {
		expect(() => fromCents(12.5)).toThrow('Valor em centavos inválido.');
	});

	it('rejects negative cents', () => {
		expect(() => fromCents(-100)).toThrow(
			'O valor em centavos não pode ser negativo.',
		);
	});
});

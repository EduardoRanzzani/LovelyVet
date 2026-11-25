import { describe, expect, it } from 'vitest';
import { filterServicesForSpecies, totalForLine, totalForItems } from './appointment-items';
describe('catálogo de serviços por espécie', () => {
	const services = [
		{ id: 'v10', specieId: 'canine', priceInCents: 8500 },
		{ id: 'v5', specieId: 'feline', priceInCents: 10000 },
		{ id: 'general', specieId: null, priceInCents: 5000 },
	];
	it('exibe apenas serviços caninos e gerais para cães, preservando os valores', () => {
		expect(filterServicesForSpecies(services, 'canine')).toEqual([services[0], services[2]]);
	});
	it('exibe apenas serviços felinos e gerais para gatos', () => {
		expect(filterServicesForSpecies(services, 'feline')).toEqual([services[1], services[2]]);
	});
	it('sem espécie identificada, permite apenas serviços gerais', () => {
		expect(filterServicesForSpecies(services, undefined)).toEqual([services[2]]);
	});
	it('não modifica o catálogo original e retorna vazio sem serviços compatíveis', () => {
		expect(filterServicesForSpecies(services.slice(0, 2), 'other')).toEqual([]);
		expect(services).toHaveLength(3);
	});
});

describe('valores históricos dos itens', () => {
	it('calcula quantidade e desconto em centavos', () => {
		expect(totalForLine({ quantity: 3, unitPriceInCents: 1250, discountInCents: 250 })).toBe(3500);
	});
	it('soma itens heterogêneos', () => {
		expect(
			totalForItems([
				{ quantity: 1, unitPriceInCents: 8500, discountInCents: 0 },
				{ quantity: 2, unitPriceInCents: 3000, discountInCents: 500 },
			]),
		).toBe(14000);
	});
	it('rejeita total acima do limite inteiro do PostgreSQL', () => {
		expect(() => totalForItems([{ quantity: 999, unitPriceInCents: 100_000_000, discountInCents: 0 }])).toThrow(
			'limite',
		);
	});
	it('rejeita desconto excessivo e valores negativos', () => {
		expect(() => totalForLine({ quantity: 1, unitPriceInCents: 500, discountInCents: 501 })).toThrow();
		expect(() => totalForLine({ quantity: -1, unitPriceInCents: 500, discountInCents: 0 })).toThrow();
	});
});

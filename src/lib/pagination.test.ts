import { describe, expect, it } from 'vitest';

import { normalizePagination } from './pagination';

describe('normalizePagination', () => {
	it('uses defaults', () => {
		expect(normalizePagination()).toEqual({
			page: 1,
			limit: 10,
			offset: 0,
		});
	});

	it('accepts valid numeric values', () => {
		expect(normalizePagination(3, 20)).toEqual({
			page: 3,
			limit: 20,
			offset: 40,
		});
	});

	it('accepts numeric strings', () => {
		expect(normalizePagination('2', '25')).toEqual({
			page: 2,
			limit: 25,
			offset: 25,
		});
	});

	it('clamps page to at least one', () => {
		expect(normalizePagination(-10, 10).page).toBe(1);
	});

	it('clamps limit to at least one', () => {
		expect(normalizePagination(1, 0).limit).toBe(1);
	});

	it('clamps limit to the maximum', () => {
		expect(normalizePagination(1, 999999).limit).toBe(100);
	});

	it('uses defaults for invalid values', () => {
		expect(normalizePagination('abc', 'xyz')).toEqual({
			page: 1,
			limit: 10,
			offset: 0,
		});
	});

	it('truncates fractional values', () => {
		expect(normalizePagination(2.9, 20.7)).toEqual({
			page: 2,
			limit: 20,
			offset: 20,
		});
	});
});

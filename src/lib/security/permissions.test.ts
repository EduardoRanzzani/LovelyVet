import { describe, expect, it } from 'vitest';

import { canAccessPath } from '@/lib/security/permissions';

describe('canAccessPath', () => {
	it.each([
		['admin', '/admin'],
		['admin', '/messages'],
		['doctor', '/agenda'],
		['doctor', '/prescriptions/123'],
		['customer', '/pets/123'],
		['customer', '/prescriptions/print/123'],
	] as const)('allows %s to access %s', (role, pathname) => {
		expect(canAccessPath(role, pathname)).toBe(true);
	});

	it.each([
		['doctor', '/admin'],
		['doctor', '/messages'],
		['customer', '/agenda'],
		['customer', '/prescriptions'],
		['customer', '/prescriptions-items'],
		['admin', '/unknown'],
	] as const)('denies %s access to %s', (role, pathname) => {
		expect(canAccessPath(role, pathname)).toBe(false);
	});

	it('does not treat a similar route prefix as an allowed child route', () => {
		expect(canAccessPath('admin', '/administrator')).toBe(false);
	});
});

import { describe, expect, it } from 'vitest';

import { DEFAULT_USER_ROLE, isUserRole, normalizeUserRole } from '@/lib/security/roles';

describe('user roles', () => {
	it.each(['admin', 'doctor', 'customer'])('accepts and preserves %s', (role) => {
		expect(isUserRole(role)).toBe(true);
		expect(normalizeUserRole(role)).toBe(role);
	});

	it.each([undefined, null, '', 'staff', 'ADMIN', 1, {}, ['admin']])(
		'rejects invalid role %j and falls back to customer',
		(value) => {
			expect(isUserRole(value)).toBe(false);
			expect(normalizeUserRole(value)).toBe('customer');
		},
	);

	it('defaults to the customer role', () => {
		expect(DEFAULT_USER_ROLE).toBe('customer');
	});
});

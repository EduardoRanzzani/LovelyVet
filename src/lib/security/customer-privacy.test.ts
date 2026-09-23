import { describe, expect, it } from 'vitest';

import type { AuthContext } from '@/lib/security/auth-context';
import { canAccessTutorScopedData } from '@/lib/security/customer-privacy';

const context = (
	role: AuthContext['role'],
	customerId: string | null = role === 'customer' ? 'customer-a' : null,
): AuthContext => ({
	clerkUserId: 'clerk-user-id',
	userId: 'user-id',
	role,
	customerId,
	doctorId: role === 'doctor' ? 'doctor-id' : null,
});

describe('canAccessTutorScopedData', () => {
	it('allows a customer to access a document issued to the same tutor', () => {
		expect(
			canAccessTutorScopedData(context('customer'), 'customer-a'),
		).toBe(true);
	});

	it('blocks a customer from a document issued to another tutor', () => {
		expect(
			canAccessTutorScopedData(context('customer'), 'customer-b'),
		).toBe(false);
	});

	it('allows legacy pet-scoped data without a tutor id', () => {
		expect(canAccessTutorScopedData(context('customer'), null)).toBe(true);
		expect(canAccessTutorScopedData(context('customer'), undefined)).toBe(true);
	});

	it('denies tutor-scoped customer data when the customer profile is missing', () => {
		expect(
			canAccessTutorScopedData(context('customer', null), 'customer-a'),
		).toBe(false);
	});

	it.each(['admin', 'doctor'] as const)(
		'allows %s to access tutor-scoped data',
		(role) => {
			expect(canAccessTutorScopedData(context(role), 'customer-b')).toBe(true);
		},
	);
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const databaseMocks = vi.hoisted(() => ({
	findIdentity: vi.fn(),
}));

vi.mock('@/db', () => ({
	db: {
		query: {
			clerkIdentitiesTable: {
				findFirst: databaseMocks.findIdentity,
			},
		},
	},
}));

import { findUserByClerkUserId } from './user-identity';

describe('findUserByClerkUserId', () => {
	beforeEach(() => {
		databaseMocks.findIdentity.mockReset();
	});

	it('returns the user linked through the identities table', async () => {
		const user = { id: 'local-user-id', role: 'admin' };
		databaseMocks.findIdentity.mockResolvedValue({ user });

		await expect(findUserByClerkUserId('clerk-user-id')).resolves.toBe(user);
	});

	it('returns undefined when the Clerk identity is not linked', async () => {
		databaseMocks.findIdentity.mockResolvedValue(undefined);

		await expect(
			findUserByClerkUserId('unknown-clerk-user-id'),
		).resolves.toBeUndefined();
	});
});

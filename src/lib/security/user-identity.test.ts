import { beforeEach, describe, expect, it, vi } from 'vitest';

const databaseMocks = vi.hoisted(() => ({
	findIdentity: vi.fn(),
	findLegacyUser: vi.fn(),
}));

vi.mock('@/db', () => ({
	db: {
		query: {
			clerkIdentitiesTable: {
				findFirst: databaseMocks.findIdentity,
			},
			usersTable: {
				findFirst: databaseMocks.findLegacyUser,
			},
		},
	},
}));

import { findUserByClerkUserId } from './user-identity';

describe('findUserByClerkUserId', () => {
	beforeEach(() => {
		databaseMocks.findIdentity.mockReset();
		databaseMocks.findLegacyUser.mockReset();
	});

	it('returns the user linked through the identities table', async () => {
		const user = { id: 'local-user-id', role: 'admin' };
		databaseMocks.findIdentity.mockResolvedValue({ user });

		await expect(findUserByClerkUserId('clerk-user-id')).resolves.toBe(user);
		expect(databaseMocks.findLegacyUser).not.toHaveBeenCalled();
	});

	it('falls back to the legacy users column during migration', async () => {
		const user = { id: 'legacy-user-id', role: 'doctor' };
		databaseMocks.findIdentity.mockResolvedValue(undefined);
		databaseMocks.findLegacyUser.mockResolvedValue(user);

		await expect(findUserByClerkUserId('clerk-user-id')).resolves.toBe(user);
		expect(databaseMocks.findLegacyUser).toHaveBeenCalledOnce();
	});

	it('returns undefined when neither identity source contains the user', async () => {
		databaseMocks.findIdentity.mockResolvedValue(undefined);
		databaseMocks.findLegacyUser.mockResolvedValue(undefined);

		await expect(
			findUserByClerkUserId('unknown-clerk-user-id'),
		).resolves.toBeUndefined();
	});
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PgDialect } from 'drizzle-orm/pg-core';

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
		vi.stubEnv('CLERK_ENVIRONMENT', 'development');
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('returns the user linked through the identities table', async () => {
		const user = { id: 'local-user-id', role: 'admin' };
		databaseMocks.findIdentity.mockResolvedValue({ user });

		await expect(findUserByClerkUserId('clerk-user-id')).resolves.toBe(user);
	});

	it('returns undefined when the Clerk identity is not linked', async () => {
		databaseMocks.findIdentity.mockResolvedValue(undefined);

		await expect(findUserByClerkUserId('unknown-clerk-user-id')).resolves.toBeUndefined();
	});

	it.each(['development', 'production'] as const)('filters the identity by %s', async (environment) => {
		vi.stubEnv('CLERK_ENVIRONMENT', environment);
		await findUserByClerkUserId('clerk-user-id');
		const query = new PgDialect().sqlToQuery(databaseMocks.findIdentity.mock.calls[0][0].where);
		expect(query.sql).toContain('"clerk_identities"."environment"');
		expect(query.sql).toContain('"clerk_identities"."clerk_user_id"');
		expect(query.params).toEqual(['clerk-user-id', environment]);
	});

	it('fails closed if the environment is not configured', async () => {
		vi.stubEnv('CLERK_ENVIRONMENT', '');
		await expect(findUserByClerkUserId('clerk-user-id')).rejects.toThrow('CLERK_ENVIRONMENT');
		expect(databaseMocks.findIdentity).not.toHaveBeenCalled();
	});
});

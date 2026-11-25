import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import { clerkIdentitiesTable, usersTable } from '@/db/schema';
import { provisionClerkIdentity, type IdentityTransaction } from './clerk-identity-provisioning';

const input = {
	clerkUserId: 'user_new',
	environment: 'development' as const,
	name: 'Tutor de teste',
	email: 'tutor@example.invalid',
};
const user = { id: 'local-user', role: 'customer' };
const findFirst = vi.fn();
const returning = vi.fn();
const onConflictDoNothing = vi.fn();
const userValues = vi.fn();
const identityValues = vi.fn();
const insert = vi.fn();
const transaction = {
	query: { clerkIdentitiesTable: { findFirst } },
	insert,
} as unknown as IdentityTransaction;

describe('provisionamento seguro de identidades Clerk', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		findFirst.mockResolvedValue(undefined);
		returning.mockResolvedValue([user]);
		onConflictDoNothing.mockReturnValue({ returning });
		userValues.mockReturnValue({ onConflictDoNothing });
		identityValues.mockResolvedValue(undefined);
		insert.mockImplementation((table) => ({ values: table === usersTable ? userValues : identityValues }));
	});

	it('cria um usuário sem privilégios e uma identidade sem upsert destrutivo', async () => {
		expect(await provisionClerkIdentity(transaction, input)).toEqual({ user, created: true });
		expect(userValues).toHaveBeenCalledWith({
			name: input.name,
			email: input.email,
			image: undefined,
			role: 'customer',
			isRegistrationComplete: false,
		});
		expect(onConflictDoNothing).toHaveBeenCalledWith({ target: usersTable.email });
		expect(insert).toHaveBeenNthCalledWith(2, clerkIdentitiesTable);
		expect(identityValues).toHaveBeenCalledWith({
			userId: user.id,
			clerkUserId: input.clerkUserId,
			environment: input.environment,
		});
	});

	it.each(['admin', 'doctor', 'customer'])('não altera uma identidade existente de perfil %s', async (role) => {
		const existing = { ...user, role };
		findFirst.mockResolvedValue({ user: existing });
		expect(await provisionClerkIdentity(transaction, input)).toEqual({ user: existing, created: false });
		expect(insert).not.toHaveBeenCalled();
	});

	it('não vincula por e-mail quando uma conta local já existe', async () => {
		returning.mockResolvedValue([]);
		expect(await provisionClerkIdentity(transaction, input)).toBeNull();
		expect(identityValues).not.toHaveBeenCalled();
		expect(findFirst).toHaveBeenCalledTimes(2);
	});

	it('reaproveita o cadastro concorrente somente quando a mesma identidade foi gravada', async () => {
		returning.mockResolvedValue([]);
		findFirst.mockResolvedValueOnce(undefined).mockResolvedValueOnce({ user });
		expect(await provisionClerkIdentity(transaction, input)).toEqual({ user, created: false });
		expect(identityValues).not.toHaveBeenCalled();
		for (const [query] of findFirst.mock.calls) {
			expect(new PgDialect().sqlToQuery(query.where).params).toEqual([input.clerkUserId, input.environment]);
		}
	});

	it('propaga colisões de identidade para abortar a transação, sem substituir vínculos', async () => {
		identityValues.mockRejectedValue(new Error('unique constraint'));
		await expect(provisionClerkIdentity(transaction, input)).rejects.toThrow('unique constraint');
		expect(identityValues).toHaveBeenCalledTimes(1);
	});
});

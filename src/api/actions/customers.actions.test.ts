import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthContext } from '@/lib/security/auth-context';

const mocks = vi.hoisted(() => ({
	customer: vi.fn(),
	user: vi.fn(),
	transaction: vi.fn(),
	update: vi.fn(),
	set: vi.fn(),
	where: vi.fn(),
	returning: vi.fn(),
	auth: vi.fn(),
	createClerk: vi.fn(),
}));
vi.mock('@/db', () => ({
	db: {
		query: { customersTable: { findFirst: mocks.customer }, usersTable: { findFirst: mocks.user } },
		transaction: mocks.transaction,
	},
}));
vi.mock('@/lib/security/auth-context', () => ({ requireAuthContext: mocks.auth }));
vi.mock('@/lib/integrations/clerk', () => ({ createNewClerkUser: mocks.createClerk }));
vi.mock('@/lib/integrations/clerk-environment', () => ({ getClerkEnvironment: () => 'development' }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/next-safe-action', () => ({
	actionClient: {
		schema: () => ({
			action: (handler: (args: { parsedInput: unknown }) => unknown) => (parsedInput: unknown) =>
				handler({ parsedInput }),
		}),
	},
}));

import { upsertCustomer } from './customers.actions';

const doctor: AuthContext = {
	role: 'doctor',
	customerId: null,
	doctorId: 'doctor',
	userId: 'user-doctor',
	clerkUserId: 'clerk-doctor',
};
const user = { id: '11111111-1111-4111-8111-111111111111', role: 'admin' };
const input = {
	id: '22222222-2222-4222-8222-222222222222',
	name: 'Cliente',
	email: 'cliente@example.com',
	cpf: '00000000000',
	phone: '00000000000',
	gender: 'male' as const,
	postalCode: '00000000',
	address: 'Rua',
	neighborhood: 'Bairro',
	city: 'Cidade',
	state: 'MS',
};
const dialect = new PgDialect();

describe('proteção de contas da equipe no cadastro de clientes', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mocks.auth.mockResolvedValue(doctor);
		mocks.customer.mockResolvedValueOnce({ id: input.id, user }).mockResolvedValueOnce(undefined);
		mocks.transaction.mockImplementation(async (callback) => callback({ update: mocks.update }));
		mocks.update.mockReturnValue({ set: mocks.set });
		mocks.set.mockReturnValue({ where: mocks.where });
		mocks.where.mockReturnValue({ returning: mocks.returning });
		mocks.returning.mockResolvedValue([user]);
	});

	it('nega edição de um cliente vinculado a conta Admin por Doctor', async () => {
		await expect(upsertCustomer(input)).rejects.toThrow('Usuário não autorizado');
		expect(mocks.transaction).not.toHaveBeenCalled();
	});

	it('nega associação pelo e-mail de uma conta privilegiada por Doctor', async () => {
		mocks.customer.mockReset().mockResolvedValue(undefined);
		mocks.user.mockResolvedValue({ ...user, role: 'doctor' });
		await expect(upsertCustomer({ ...input, id: undefined })).rejects.toThrow('Usuário não autorizado');
		expect(mocks.createClerk).not.toHaveBeenCalled();
		expect(mocks.transaction).not.toHaveBeenCalled();
	});

	it('preserva a edição administrativa de cliente vinculado à equipe', async () => {
		mocks.auth.mockResolvedValue({ ...doctor, role: 'admin' });
		await expect(upsertCustomer(input)).resolves.toBeUndefined();
		expect(dialect.sqlToQuery(mocks.where.mock.calls[0][0]).params).toEqual([user.id]);
	});

	it('permite que Doctor edite uma conta de cliente comum', async () => {
		const regularUser = { ...user, role: 'customer' };
		mocks.customer.mockReset().mockResolvedValueOnce({ id: input.id, user: regularUser });
		mocks.returning.mockResolvedValue([regularUser]);
		await expect(upsertCustomer(input)).resolves.toBeUndefined();
		expect(dialect.sqlToQuery(mocks.where.mock.calls[0][0]).params).toEqual([user.id, 'customer']);
		expect(mocks.update).toHaveBeenCalledTimes(2);
	});

	it('revalida o papel de customer na escrita da conta por Doctor', async () => {
		mocks.customer.mockReset().mockResolvedValueOnce({ id: input.id, user: { ...user, role: 'customer' } });
		mocks.returning.mockResolvedValue([]);
		await expect(upsertCustomer(input)).rejects.toThrow('Usuário base não encontrado');
		expect(dialect.sqlToQuery(mocks.where.mock.calls[0][0]).params).toEqual([user.id, 'customer']);
		expect(mocks.update).toHaveBeenCalledTimes(1);
	});
});

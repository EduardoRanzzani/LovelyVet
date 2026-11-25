import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { customersTable, doctorsTable, usersTable } from '@/db/schema';

const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
	findUser: vi.fn(),
	findCustomer: vi.fn(),
	findDoctor: vi.fn(),
	createClerk: vi.fn(),
	provision: vi.fn(),
	transaction: vi.fn(),
	update: vi.fn(),
	set: vi.fn(),
	where: vi.fn(),
	returning: vi.fn(),
	insert: vi.fn(),
	values: vi.fn(),
	findIdentity: vi.fn(),
}));
vi.mock('@/db', () => ({
	db: {
		query: {
			usersTable: { findFirst: mocks.findUser },
			customersTable: { findFirst: mocks.findCustomer },
			doctorsTable: { findFirst: mocks.findDoctor },
			clerkIdentitiesTable: { findFirst: mocks.findIdentity },
		},
		transaction: mocks.transaction,
	},
}));
vi.mock('@/lib/security/auth-context', () => ({ requireAuthContext: mocks.auth }));
vi.mock('@/lib/integrations/clerk', () => ({ createNewClerkUser: mocks.createClerk }));
vi.mock('@/lib/security/clerk-identity-provisioning', async (importOriginal) => ({
	...(await importOriginal<typeof import('@/lib/security/clerk-identity-provisioning')>()),
	provisionClerkIdentity: mocks.provision,
}));
vi.mock('@/lib/next-safe-action', () => ({
	actionClient: {
		schema: () => ({
			action: (handler: (args: { parsedInput: unknown }) => unknown) => (parsedInput: unknown) =>
				handler({ parsedInput }),
		}),
	},
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { upsertCustomer } from './customers.actions';
import { upsertDoctor } from './doctors.actions';
import { verifyCurrentClerkIdentity } from './admin.actions';

const input = {
	name: 'Pessoa Teste',
	email: 'pessoa@example.invalid',
	phone: '00000000000',
	cpf: '00000000000',
	gender: 'female' as const,
	postalCode: '00000000',
	address: 'Rua Teste',
	neighborhood: 'Bairro Teste',
	city: 'Cidade Teste',
	state: 'MS',
	licenseNumber: '123',
	licenseState: 'MS',
	specialty: 'Clínica geral',
	availableFromWeekDay: '1' as const,
	availableToWeekDay: '5' as const,
	availableFromTime: '08:00',
	availableToTime: '18:00',
};
const user = { id: 'local-user', role: 'customer' };
const cases = [
	{ label: 'cliente', action: upsertCustomer, table: customersTable },
	{ label: 'veterinário', action: upsertDoctor, table: doctorsTable },
];

describe('cadastro pela equipe e identidades Clerk', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.stubEnv('CLERK_ENVIRONMENT', 'development');
		mocks.auth.mockResolvedValue({ role: 'admin', userId: 'admin-local', clerkUserId: 'user_admin' });
		mocks.createClerk.mockResolvedValue({ id: 'user_new' });
		mocks.provision.mockResolvedValue({ user, created: false });
		mocks.transaction.mockImplementation((callback) => callback({ update: mocks.update, insert: mocks.insert }));
		mocks.update.mockReturnValue({ set: mocks.set });
		mocks.set.mockReturnValue({ where: mocks.where });
		mocks.where.mockReturnValue({ returning: mocks.returning });
		mocks.returning.mockResolvedValue([user]);
		mocks.insert.mockReturnValue({ values: mocks.values });
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it.each(cases)(
		'reaproveita a mesma identidade criada pelo webhook no cadastro de $label',
		async ({ action, table }) => {
			await action(input);
			expect(mocks.provision).toHaveBeenCalledWith(expect.anything(), {
				clerkUserId: 'user_new',
				environment: 'development',
				name: input.name,
				email: input.email,
				image: undefined,
			});
			expect(mocks.update).toHaveBeenCalledWith(usersTable);
			expect(mocks.insert).toHaveBeenCalledTimes(1);
			expect(mocks.insert).toHaveBeenCalledWith(table);
			expect(mocks.values).toHaveBeenCalledWith(expect.objectContaining({ userId: user.id }));
		},
	);

	it.each(cases)('interrompe o cadastro de $label diante de uma colisão de identidade', async ({ action }) => {
		mocks.provision.mockResolvedValue(null);
		await expect(action(input)).rejects.toThrow('Identidade Clerk em conflito');
		expect(mocks.update).not.toHaveBeenCalled();
		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it('preserva o papel administrativo ao editar o perfil de um veterinário administrador', async () => {
		mocks.findDoctor.mockResolvedValueOnce({ id: 'doctor-id', user: { ...user, role: 'admin' } });
		await upsertDoctor({ ...input, id: '11111111-1111-4111-8111-111111111111' });
		expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' }));
		expect(mocks.createClerk).not.toHaveBeenCalled();
	});

	it('a verificação administrativa não precisa inserir ou substituir identidades', async () => {
		mocks.findIdentity.mockResolvedValue({ userId: 'admin-local' });
		await expect(verifyCurrentClerkIdentity({})).resolves.toEqual({ environment: 'development' });
		expect(mocks.transaction).not.toHaveBeenCalled();
	});

	it('não permite que outro perfil use a verificação administrativa', async () => {
		mocks.auth.mockResolvedValue({ role: 'customer', userId: 'local-user', clerkUserId: 'user_new' });
		await expect(verifyCurrentClerkIdentity({})).rejects.toThrow('Usuário não autorizado');
		expect(mocks.findIdentity).not.toHaveBeenCalled();
	});
});

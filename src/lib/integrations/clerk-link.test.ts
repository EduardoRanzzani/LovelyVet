import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getClerkIdentityForLink } from './clerk-link';
const m = vi.hoisted(() => ({ create: vi.fn(), getUser: vi.fn() }));
vi.mock('@clerk/nextjs/server', () => ({ createClerkClient: m.create }));
const user = {
	id: 'user_target',
	firstName: 'Tutor',
	lastName: 'Teste',
	primaryEmailAddressId: 'email_1',
	emailAddresses: [{ id: 'email_1', emailAddress: 'tutor@example.invalid', verification: { status: 'verified' } }],
	banned: false,
	locked: false,
};
describe('consulta da identidade Clerk para vínculo manual', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.stubEnv('CLERK_ENVIRONMENT', 'development');
		vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake');
		m.create.mockReturnValue({ users: { getUser: m.getUser } });
		m.getUser.mockResolvedValue(user);
	});
	afterEach(() => {
		vi.unstubAllEnvs();
	});
	it('consulta a identidade usando somente a chave do ambiente atual', async () => {
		expect(await getClerkIdentityForLink(user.id)).toEqual({
			id: user.id,
			name: 'Tutor Teste',
			email: 'tutor@example.invalid',
		});
		expect(m.create).toHaveBeenCalledWith({ secretKey: 'sk_test_fake' });
	});
	it('rejeita chave de produção em desenvolvimento', async () => {
		vi.stubEnv('CLERK_SECRET_KEY', 'sk_live_fake');
		await expect(getClerkIdentityForLink(user.id)).rejects.toThrow('não corresponde');
		expect(m.create).not.toHaveBeenCalled();
	});
	it.each([
		{ ...user, banned: true },
		{ ...user, locked: true },
		{ ...user, primaryEmailAddressId: 'missing' },
		{ ...user, emailAddresses: [{ ...user.emailAddresses[0], verification: { status: 'unverified' } }] },
	])('rejeita identidade não elegível %#', async (value) => {
		m.getUser.mockResolvedValue(value);
		expect(await getClerkIdentityForLink(user.id)).toBeNull();
	});
	it('trata identidade inexistente sem gravar', async () => {
		m.getUser.mockRejectedValue({ status: 404 });
		expect(await getClerkIdentityForLink(user.id)).toBeNull();
	});
	it('propaga falha de comunicação', async () => {
		m.getUser.mockRejectedValue(new Error('network'));
		await expect(getClerkIdentityForLink(user.id)).rejects.toThrow('network');
	});
});

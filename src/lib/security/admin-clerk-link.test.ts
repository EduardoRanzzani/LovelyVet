import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { clerkIdentitiesTable, clerkIdentityLinkAuditTable } from '@/db/schema';
import { clerkLinkSchema, previewAdminClerkLink, confirmAdminClerkLink } from './admin-clerk-link';
import type { AuthContext } from './auth-context';

const m = vi.hoisted(() => ({
	findUser: vi.fn(),
	findIdentity: vi.fn(),
	remote: vi.fn(),
	transaction: vi.fn(),
	select: vi.fn(),
	insert: vi.fn(),
	identityValues: vi.fn(),
	auditValues: vi.fn(),
	returning: vi.fn(),
	locks: vi.fn(),
}));
vi.mock('@/db', () => ({
	db: {
		query: { usersTable: { findFirst: m.findUser }, clerkIdentitiesTable: { findFirst: m.findIdentity } },
		transaction: m.transaction,
	},
}));
vi.mock('@/lib/integrations/clerk-link', () => ({ getClerkIdentityForLink: m.remote }));
vi.mock('./auth-context', () => ({ requireAuthContext: vi.fn() }));

const actor: AuthContext = {
	userId: '11111111-1111-4111-8111-111111111111',
	clerkUserId: 'user_admin',
	role: 'admin',
	doctorId: null,
	customerId: null,
};
const input = {
	userId: '22222222-2222-4222-8222-222222222222',
	clerkUserId: 'user_target',
	environment: 'development' as const,
};
const target = { id: input.userId, email: 'tutor@example.invalid', role: 'customer' };
const remote = { id: input.clerkUserId, name: 'Tutor Teste', email: target.email };
const setupLocks = (users: unknown[], identities: unknown[] = [{ id: 'identity' }]) => {
	m.locks.mockReset().mockResolvedValueOnce(users).mockResolvedValueOnce(identities);
};

describe('vínculo administrativo de identidade Clerk', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.stubEnv('CLERK_ENVIRONMENT', 'development');
		m.findUser.mockResolvedValue(target);
		m.findIdentity.mockResolvedValue(undefined);
		m.remote.mockResolvedValue(remote);
		m.transaction.mockImplementation((callback) => callback({ select: m.select, insert: m.insert }));
		m.select.mockReturnValue({
			from: () => ({ where: () => ({ orderBy: () => ({ for: m.locks }), for: m.locks }) }),
		});
		setupLocks([{ id: actor.userId, role: 'admin' }, target]);
		m.insert.mockImplementation((table) => ({
			values: table === clerkIdentitiesTable ? m.identityValues : m.auditValues,
		}));
		m.identityValues.mockReturnValue({ onConflictDoNothing: () => ({ returning: m.returning }) });
		m.returning.mockResolvedValue([{ id: 'new-identity' }]);
		m.auditValues.mockResolvedValue(undefined);
	});
	afterEach(() => {
		vi.unstubAllEnvs();
	});
	it.each(['doctor', 'customer'] as const)('bloqueia o perfil %s antes de consultar o Clerk', async (role) => {
		await expect(previewAdminClerkLink({ ...actor, role }, input)).rejects.toThrow('não autorizado');
		await expect(confirmAdminClerkLink({ ...actor, role }, input)).rejects.toThrow('não autorizado');
		expect(m.remote).not.toHaveBeenCalled();
		expect(m.transaction).not.toHaveBeenCalled();
	});
	it('bloqueia ambiente diferente do configurado', async () => {
		const wrong = { ...input, environment: 'production' as const };
		expect(await previewAdminClerkLink(actor, wrong)).toMatchObject({ ok: false });
		expect(await confirmAdminClerkLink(actor, wrong)).toMatchObject({ ok: false });
		expect(m.remote).not.toHaveBeenCalled();
	});
	it('valida o ID e o UUID', () => {
		expect(clerkLinkSchema.safeParse(input).success).toBe(true);
		expect(clerkLinkSchema.safeParse({ ...input, clerkUserId: 'invalid' }).success).toBe(false);
		expect(clerkLinkSchema.safeParse({ ...input, userId: 'invalid' }).success).toBe(false);
	});
	it('mostra prévia somente quando o e-mail corresponde, sem gravar', async () => {
		expect(await previewAdminClerkLink(actor, input)).toEqual({
			ok: true,
			value: { name: remote.name, email: remote.email, clerkUserId: remote.id, environment: input.environment },
		});
		expect(m.transaction).not.toHaveBeenCalled();
	});
	it('rejeita uma identidade já vinculada', async () => {
		m.findIdentity.mockResolvedValue({ id: 'existing' });
		expect(await previewAdminClerkLink(actor, input)).toMatchObject({ ok: false });
		expect(m.remote).not.toHaveBeenCalled();
	});
	it.each([null, { ...remote, email: 'other@example.invalid' }, { ...remote, id: 'user_other' }])(
		'rejeita identidade incompatível: %j',
		async (value) => {
			m.remote.mockResolvedValue(value);
			expect(await previewAdminClerkLink(actor, input)).toMatchObject({ ok: false });
			expect(await confirmAdminClerkLink(actor, input)).toMatchObject({ ok: false });
			expect(m.insert).not.toHaveBeenCalled();
		},
	);
	it('grava somente vínculo e auditoria na mesma transação', async () => {
		expect(await confirmAdminClerkLink(actor, input)).toMatchObject({ ok: true });
		expect(m.insert).toHaveBeenNthCalledWith(1, clerkIdentitiesTable);
		expect(m.identityValues).toHaveBeenCalledWith(input);
		expect(m.insert).toHaveBeenNthCalledWith(2, clerkIdentityLinkAuditTable);
		expect(m.auditValues).toHaveBeenCalledWith({
			adminUserId: actor.userId,
			adminClerkUserId: actor.clerkUserId,
			targetUserId: input.userId,
			environment: input.environment,
			clerkUserId: input.clerkUserId,
		});
	});
	it('revalida o e-mail local após a prévia', async () => {
		await previewAdminClerkLink(actor, input);
		setupLocks([
			{ id: actor.userId, role: 'admin' },
			{ ...target, email: 'changed@example.invalid' },
		]);
		expect(await confirmAdminClerkLink(actor, input)).toMatchObject({ ok: false });
		expect(m.remote).toHaveBeenCalledTimes(2);
		expect(m.insert).not.toHaveBeenCalled();
	});
	it('bloqueia administrador cujo vínculo foi revogado', async () => {
		setupLocks([{ id: actor.userId, role: 'admin' }, target], []);
		expect(await confirmAdminClerkLink(actor, input)).toMatchObject({ ok: false });
		expect(m.insert).not.toHaveBeenCalled();
	});
	it('bloqueia administrador cujo papel foi alterado', async () => {
		setupLocks([{ id: actor.userId, role: 'doctor' }, target]);
		expect(await confirmAdminClerkLink(actor, input)).toMatchObject({ ok: false });
		expect(m.insert).not.toHaveBeenCalled();
	});
	it('não sobrescreve nem registra auditoria quando há conflito concorrente', async () => {
		m.returning.mockResolvedValue([]);
		expect(await confirmAdminClerkLink(actor, input)).toMatchObject({ ok: false });
		expect(m.auditValues).not.toHaveBeenCalled();
	});
	it('propaga falha na auditoria para abortar a transação', async () => {
		m.auditValues.mockRejectedValue(new Error('audit failed'));
		await expect(confirmAdminClerkLink(actor, input)).rejects.toThrow('audit failed');
	});
});

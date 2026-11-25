// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import { Webhook } from 'svix';

const mocks = vi.hoisted(() => ({
	transaction: vi.fn(),
	find: vi.fn(),
	provision: vi.fn(),
	update: vi.fn(),
	set: vi.fn(),
	updateWhere: vi.fn(),
	delete: vi.fn(),
	deleteWhere: vi.fn(),
	returning: vi.fn(),
}));
vi.mock('@/db', () => ({ db: { transaction: mocks.transaction, delete: mocks.delete } }));
vi.mock('@/lib/security/clerk-identity-provisioning', async (importOriginal) => ({
	...(await importOriginal<typeof import('@/lib/security/clerk-identity-provisioning')>()),
	findIdentityUser: mocks.find,
	provisionClerkIdentity: mocks.provision,
}));

import { POST } from './route';

const secret = `whsec_${Buffer.alloc(32, 7).toString('base64')}`;
const data = {
	id: 'user_test',
	first_name: 'Tutor',
	last_name: 'Teste',
	image_url: 'https://example.invalid/photo',
	primary_email_address_id: 'primary',
	email_addresses: [{ id: 'primary', email_address: 'tutor@example.invalid', verification: { status: 'verified' } }],
	public_metadata: { role: 'admin' },
};

const request = (type = 'user.created', payload: unknown = data, valid = true) => {
	const body = JSON.stringify({ type, data: payload }, null, 2);
	const timestamp = new Date();
	const id = 'msg_test';
	return new Request('http://localhost/api/webhooks/clerk', {
		method: 'POST',
		body,
		headers: {
			'svix-id': id,
			'svix-timestamp': String(Math.floor(timestamp.getTime() / 1000)),
			'svix-signature': new Webhook(secret).sign(id, timestamp, valid ? body : '{}'),
		},
	});
};

describe('webhook Clerk', () => {
	beforeEach(async () => {
		vi.resetAllMocks();
		vi.stubEnv('CLERK_ENVIRONMENT', 'development');
		vi.stubEnv('CLERK_WEBHOOK_SECRET', secret);
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const { QueryBuilder } = await import('drizzle-orm/pg-core');
		const qb = new QueryBuilder();
		mocks.transaction.mockImplementation((callback) =>
			callback({ select: qb.select.bind(qb), update: mocks.update }),
		);
		mocks.find.mockResolvedValue(undefined);
		mocks.provision.mockResolvedValue({ user: { id: 'local-user' }, created: true });
		mocks.update.mockReturnValue({ set: mocks.set });
		mocks.set.mockReturnValue({ where: mocks.updateWhere });
		mocks.delete.mockReturnValue({ where: mocks.deleteWhere });
		mocks.deleteWhere.mockReturnValue({ returning: mocks.returning });
		mocks.returning.mockResolvedValue([{ userId: 'local-user' }]);
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('valida a assinatura do corpo original, inclusive com espaços e quebras de linha', async () => {
		const response = await POST(request());
		expect(response.status).toBe(200);
		expect(mocks.provision).toHaveBeenCalledWith(expect.anything(), {
			clerkUserId: data.id,
			environment: 'development',
			name: 'Tutor Teste',
			email: 'tutor@example.invalid',
			image: data.image_url,
		});
	});

	it('rejeita assinatura inválida antes de tocar no banco', async () => {
		expect((await POST(request('user.created', data, false))).status).toBe(400);
		expect(mocks.transaction).not.toHaveBeenCalled();
		expect(mocks.delete).not.toHaveBeenCalled();
	});

	it('rejeita requisição sem cabeçalhos Svix', async () => {
		expect((await POST(new Request('http://localhost', { method: 'POST', body: '{}' }))).status).toBe(400);
		expect(mocks.transaction).not.toHaveBeenCalled();
	});

	it.each(['user.created', 'user.updated'])('bloqueia associação por e-mail em %s', async (type) => {
		mocks.provision.mockResolvedValue(null);
		const response = await POST(request(type));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ignored: true, reason: 'manual_identity_link_required' });
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it('ignora e-mail primário não verificado mesmo com outro e-mail verificado', async () => {
		const payload = {
			...data,
			primary_email_address_id: 'unverified',
			email_addresses: [
				...data.email_addresses,
				{ id: 'unverified', email_address: 'other@example.invalid', verification: { status: 'unverified' } },
			],
		};
		expect(await (await POST(request('user.created', payload))).json()).toEqual({
			ignored: true,
			reason: 'unverified_primary_email',
		});
		expect(mocks.transaction).not.toHaveBeenCalled();
	});

	it('não regrava o perfil ao receber novamente user.created', async () => {
		mocks.find.mockResolvedValue({ id: 'local-user', role: 'admin' });
		expect((await POST(request())).status).toBe(200);
		expect(mocks.provision).not.toHaveBeenCalled();
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it('atualiza somente o perfil da identidade conhecida, sem alterar seu papel ou vínculo', async () => {
		mocks.find.mockResolvedValue({ id: 'local-user', role: 'admin' });
		expect((await POST(request('user.updated'))).status).toBe(200);
		expect(mocks.set).toHaveBeenCalledWith({
			name: 'Tutor Teste',
			email: 'tutor@example.invalid',
			image: data.image_url,
			updatedAt: expect.any(Date),
		});
		const query = new PgDialect().sqlToQuery(mocks.updateWhere.mock.calls[0][0]);
		expect(query.params).toEqual(expect.arrayContaining(['local-user', data.id, 'development']));
		expect(mocks.provision).not.toHaveBeenCalled();
	});

	it.each(['development', 'production'])('remove somente a identidade do ambiente %s', async (environment) => {
		vi.stubEnv('CLERK_ENVIRONMENT', environment);
		const response = await POST(request('user.deleted', { id: data.id }));
		expect(await response.json()).toEqual({ identityRemoved: true });
		const query = new PgDialect().sqlToQuery(mocks.deleteWhere.mock.calls[0][0]);
		expect(query.params).toEqual([data.id, environment]);
		expect(mocks.transaction).not.toHaveBeenCalled();
	});

	it('falha sem ambiente configurado', async () => {
		vi.stubEnv('CLERK_ENVIRONMENT', '');
		expect((await POST(request())).status).toBe(500);
		expect(mocks.transaction).not.toHaveBeenCalled();
	});
});

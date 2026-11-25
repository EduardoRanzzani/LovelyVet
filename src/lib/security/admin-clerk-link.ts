import 'server-only';

import { db } from '@/db';
import { clerkIdentitiesTable, clerkIdentityLinkAuditTable, usersTable } from '@/db/schema';
import { getClerkEnvironment } from '@/lib/integrations/clerk-environment';
import { getClerkIdentityForLink } from '@/lib/integrations/clerk-link';
import type { AuthContext } from '@/lib/security/auth-context';
import { requireAdmin } from '@/lib/security/authorization';
import { and, eq, inArray, or } from 'drizzle-orm';
import { z } from 'zod';

export const clerkLinkSchema = z.object({
	userId: z.uuid(),
	clerkUserId: z
		.string()
		.trim()
		.min(6)
		.max(128)
		.regex(/^user_[A-Za-z0-9]+$/),
	environment: z.enum(['development', 'production']),
});
export type ClerkLinkInput = z.infer<typeof clerkLinkSchema>;

class LinkRejected extends Error {}

const reject = (message: string): never => {
	throw new LinkRejected(message);
};

const ensureEnvironment = (input: ClerkLinkInput) => {
	if (input.environment !== getClerkEnvironment()) reject('Só é possível vincular identidades do ambiente atual.');
};

const ensureEmail = (local: string, remote: string) => {
	if (local.trim().toLowerCase() !== remote.trim().toLowerCase()) {
		reject('O e-mail primário verificado no Clerk deve corresponder ao e-mail cadastrado.');
	}
};

const conflictCondition = (input: ClerkLinkInput) =>
	or(
		eq(clerkIdentitiesTable.clerkUserId, input.clerkUserId),
		and(eq(clerkIdentitiesTable.userId, input.userId), eq(clerkIdentitiesTable.environment, input.environment)),
	);

const handleRejection = async <T>(operation: () => Promise<T>) => {
	try {
		return { ok: true as const, value: await operation() };
	} catch (error) {
		if (error instanceof LinkRejected) return { ok: false as const, message: error.message };
		throw error;
	}
};

const readVerifiedIdentity = async (input: ClerkLinkInput) => {
	const remote = await getClerkIdentityForLink(input.clerkUserId);
	if (!remote || remote.id !== input.clerkUserId || !remote.email) {
		return reject('Identidade não encontrada ou sem e-mail primário verificado neste ambiente.');
	}
	return remote;
};

export const previewAdminClerkLink = async (context: AuthContext, input: ClerkLinkInput) => {
	requireAdmin(context);
	return handleRejection(async () => {
		ensureEnvironment(input);
		const target = await db.query.usersTable.findFirst({ where: eq(usersTable.id, input.userId) });
		if (!target) return reject('Usuário não encontrado.');
		const conflict = await db.query.clerkIdentitiesTable.findFirst({ where: conflictCondition(input) });
		if (conflict) return reject('Já existe um vínculo para esta identidade ou para este usuário neste ambiente.');
		const remote = await readVerifiedIdentity(input);
		ensureEmail(target.email, remote.email);
		return { name: remote.name, email: remote.email, clerkUserId: remote.id, environment: input.environment };
	});
};

export const confirmAdminClerkLink = async (context: AuthContext, input: ClerkLinkInput) => {
	requireAdmin(context);
	return handleRejection(async () => {
		ensureEnvironment(input);
		// A confirmação não confia nos dados retornados pela prévia.
		const remote = await readVerifiedIdentity(input);
		return db.transaction(async (tx) => {
			// Bloqueia as linhas em ordem estável e revalida o administrador e o e-mail cadastrado.
			const users = await tx
				.select()
				.from(usersTable)
				.where(inArray(usersTable.id, [context.userId, input.userId]))
				.orderBy(usersTable.id)
				.for('update');
			const actor = users.find((user) => user.id === context.userId);
			if (actor?.role !== 'admin') return reject('Usuário não autorizado.');
			const [actorIdentity] = await tx
				.select({ id: clerkIdentitiesTable.id })
				.from(clerkIdentitiesTable)
				.where(
					and(
						eq(clerkIdentitiesTable.userId, context.userId),
						eq(clerkIdentitiesTable.clerkUserId, context.clerkUserId),
						eq(clerkIdentitiesTable.environment, input.environment),
					),
				)
				.for('update');
			if (!actorIdentity) return reject('Identidade administrativa não autorizada neste ambiente.');
			const target = users.find((user) => user.id === input.userId);
			if (!target) return reject('Usuário não encontrado.');
			ensureEmail(target.email, remote.email);
			// As duas constraints únicas também protegem contra inserções concorrentes.
			const [inserted] = await tx
				.insert(clerkIdentitiesTable)
				.values({
					userId: input.userId,
					clerkUserId: input.clerkUserId,
					environment: input.environment,
				})
				.onConflictDoNothing()
				.returning({ id: clerkIdentitiesTable.id });
			if (!inserted)
				return reject('Já existe um vínculo para esta identidade ou para este usuário neste ambiente.');
			await tx.insert(clerkIdentityLinkAuditTable).values({
				adminUserId: context.userId,
				adminClerkUserId: context.clerkUserId,
				targetUserId: input.userId,
				environment: input.environment,
				clerkUserId: input.clerkUserId,
			});
			return { userId: input.userId, environment: input.environment };
		});
	});
};

import type { db } from '@/db';
import { clerkIdentitiesTable, usersTable } from '@/db/schema';
import type { ClerkEnvironment } from '@/lib/integrations/clerk-environment';
import { and, eq } from 'drizzle-orm';

export type IdentityTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type ClerkIdentityKey = {
	clerkUserId: string;
	environment: ClerkEnvironment;
};

type NewIdentityUser = ClerkIdentityKey & {
	name: string;
	email: string;
	image?: string | null;
};

export const clerkIdentityCondition = ({ clerkUserId, environment }: ClerkIdentityKey) =>
	and(eq(clerkIdentitiesTable.clerkUserId, clerkUserId), eq(clerkIdentitiesTable.environment, environment));

export const findIdentityUser = async (transaction: IdentityTransaction, key: ClerkIdentityKey) => {
	const identity = await transaction.query.clerkIdentitiesTable.findFirst({
		where: clerkIdentityCondition(key),
		with: { user: true },
	});

	return identity?.user;
};

// A unique constraint de e-mail arbitra a corrida entre webhook e cadastro pela equipe.
// O conflito só pode ser reaproveitado quando a MESMA identidade já foi vinculada.
export const provisionClerkIdentity = async (transaction: IdentityTransaction, input: NewIdentityUser) => {
	const existing = await findIdentityUser(transaction, input);
	if (existing) return { user: existing, created: false };

	const [user] = await transaction
		.insert(usersTable)
		.values({
			name: input.name,
			email: input.email,
			image: input.image,
			role: 'customer',
			isRegistrationComplete: false,
		})
		.onConflictDoNothing({ target: usersTable.email })
		.returning();

	if (!user) {
		const concurrent = await findIdentityUser(transaction, input);
		return concurrent ? { user: concurrent, created: false } : null;
	}

	// Nunca sobrescrever uma identidade. Uma colisão aborta a transação inteira.
	await transaction.insert(clerkIdentitiesTable).values({
		userId: user.id,
		environment: input.environment,
		clerkUserId: input.clerkUserId,
	});

	return { user, created: true };
};

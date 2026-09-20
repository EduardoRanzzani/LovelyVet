import { db } from '@/db';
import { clerkIdentitiesTable, usersTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const findUserByClerkUserId = async (clerkUserId: string) => {
	const identity = await db.query.clerkIdentitiesTable.findFirst({
		where: eq(clerkIdentitiesTable.clerkUserId, clerkUserId),
		with: {
			user: {
				with: {
					customer: true,
					doctor: true,
				},
			},
		},
	});

	if (identity?.user) {
		return identity.user;
	}

	return db.query.usersTable.findFirst({
		where: eq(usersTable.clerkUserId, clerkUserId),
		with: {
			customer: true,
			doctor: true,
		},
	});
};

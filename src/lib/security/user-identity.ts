import { db } from '@/db';
import { clerkIdentitiesTable } from '@/db/schema';
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

	return identity?.user;
};

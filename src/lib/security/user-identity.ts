import { db } from '@/db';
import { getClerkEnvironment } from '@/lib/integrations/clerk-environment';
import { clerkIdentityCondition } from './clerk-identity-provisioning';

export const findUserByClerkUserId = async (clerkUserId: string) => {
	const identity = await db.query.clerkIdentitiesTable.findFirst({
		where: clerkIdentityCondition({ clerkUserId, environment: getClerkEnvironment() }),
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

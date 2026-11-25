import 'server-only';

import { createClerkClient } from '@clerk/nextjs/server';
import { getClerkEnvironment } from './clerk-environment';

export const getClerkIdentityForLink = async (clerkUserId: string) => {
	const environment = getClerkEnvironment();
	const secretKey = process.env.CLERK_SECRET_KEY;
	const expectedPrefix = environment === 'production' ? 'sk_live_' : 'sk_test_';
	if (!secretKey?.startsWith(expectedPrefix)) {
		throw new Error('A chave secreta Clerk não corresponde ao ambiente configurado.');
	}
	const client = createClerkClient({ secretKey });
	try {
		const user = await client.users.getUser(clerkUserId);
		const primary = user.emailAddresses.find((address) => address.id === user.primaryEmailAddressId);
		if (user.banned || user.locked || primary?.verification?.status !== 'verified') return null;
		return {
			id: user.id,
			email: primary.emailAddress,
			name: [user.firstName, user.lastName].filter(Boolean).join(' ') || primary.emailAddress,
		};
	} catch (error) {
		if (typeof error === 'object' && error !== null && 'status' in error && error.status === 404) return null;
		throw error;
	}
};

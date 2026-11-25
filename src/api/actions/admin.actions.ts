'use server';

import { db } from '@/db';
import { getClerkEnvironment } from '@/lib/integrations/clerk-environment';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireAdmin } from '@/lib/security/authorization';
import { clerkIdentityCondition } from '@/lib/security/clerk-identity-provisioning';
import z from 'zod';

export const verifyCurrentClerkIdentity = actionClient.schema(z.object({})).action(async () => {
	const context = await requireAuthContext();
	requireAdmin(context);

	const environment = getClerkEnvironment();

	const identity = await db.query.clerkIdentitiesTable.findFirst({
		where: clerkIdentityCondition({ clerkUserId: context.clerkUserId, environment }),
	});

	if (!identity || identity.userId !== context.userId) {
		throw new Error('Identidade não vinculada ao administrador neste ambiente.');
	}

	return { environment };
});

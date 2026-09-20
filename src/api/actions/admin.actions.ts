'use server';

import { db } from '@/db';
import { clerkIdentitiesTable } from '@/db/schema';
import { getClerkEnvironment } from '@/lib/integrations/clerk-environment';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireAdmin } from '@/lib/security/authorization';
import z from 'zod';

export const linkCurrentClerkIdentity = actionClient
	.schema(z.object({}))
	.action(async () => {
		const context = await requireAuthContext();
		requireAdmin(context);

		const environment = getClerkEnvironment();

		await db
			.insert(clerkIdentitiesTable)
			.values({
				userId: context.userId,
				environment,
				clerkUserId: context.clerkUserId,
			})
			.onConflictDoUpdate({
				target: [
					clerkIdentitiesTable.userId,
					clerkIdentitiesTable.environment,
				],
				set: {
					clerkUserId: context.clerkUserId,
					updatedAt: new Date(),
				},
			});

		return { environment };
	});

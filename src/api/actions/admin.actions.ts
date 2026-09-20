'use server';

import { db } from '@/db';
import { clerkIdentitiesTable, usersTable } from '@/db/schema';
import { getClerkEnvironment } from '@/lib/integrations/clerk-environment';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireAdmin } from '@/lib/security/authorization';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import z from 'zod';

const userIdProd = 'user_3AGj7pjKHaiWsfZHlq53aIRcKo7';
const userIdDev = 'user_39w5ENK2TbvmC1SbcTpN7cKNEJR';
const email = 'eduranzzani@gmail.com';

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

export const changeUserId = actionClient
	.schema(z.object({ environment: z.enum(['prod', 'dev']) }))
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireAdmin(context);

		const { environment } = parsedInput;
		const clerkUserId = environment === 'prod' ? userIdProd : userIdDev;

		try {
			await db
				.update(usersTable)
				.set({ clerkUserId: clerkUserId })
				.where(eq(usersTable.email, email));
		} catch (error) {
			console.error('Erro ao atualizar: ', { error });
		}

		revalidatePath('/admin');
	});

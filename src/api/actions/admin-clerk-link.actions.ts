'use server';

import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { clerkLinkSchema, confirmAdminClerkLink, previewAdminClerkLink } from '@/lib/security/admin-clerk-link';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export const previewClerkLink = actionClient.schema(clerkLinkSchema).action(async ({ parsedInput }) => {
	return previewAdminClerkLink(await requireAuthContext(), parsedInput);
});

export const confirmClerkLink = actionClient
	.schema(clerkLinkSchema.extend({ confirmed: z.literal(true) }))
	.action(async ({ parsedInput }) => {
		const result = await confirmAdminClerkLink(await requireAuthContext(), parsedInput);
		if (result.ok) revalidatePath('/admin');
		return result;
	});

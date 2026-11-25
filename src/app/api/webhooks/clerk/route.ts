import { db } from '@/db';
import { clerkIdentitiesTable, usersTable } from '@/db/schema';
import { getClerkEnvironment } from '@/lib/integrations/clerk-environment';
import {
	clerkIdentityCondition,
	findIdentityUser,
	provisionClerkIdentity,
} from '@/lib/security/clerk-identity-provisioning';
import type { UserJSON, WebhookEvent } from '@clerk/nextjs/server';
import { and, eq, exists } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';

const getVerifiedPrimaryEmail = (data: UserJSON): string | undefined => {
	const primary = data.email_addresses.find((address) => address.id === data.primary_email_address_id);
	return primary?.verification?.status === 'verified' ? primary.email_address : undefined;
};

const getDisplayName = (data: UserJSON, email: string): string => {
	const name = [data.first_name, data.last_name].filter(Boolean).join(' ').trim();
	return name || email;
};

const syncClerkUser = async (data: UserJSON, eventType: 'user.created' | 'user.updated') => {
	const environment = getClerkEnvironment();
	const key = { clerkUserId: data.id, environment };
	const email = getVerifiedPrimaryEmail(data);

	if (!email) return { ignored: true, reason: 'unverified_primary_email' };

	const name = getDisplayName(data, email);

	return db.transaction(async (transaction) => {
		const existing = await findIdentityUser(transaction, key);

		if (existing) {
			// Um evento de criação repetido não pode restaurar dados de perfil antigos.
			if (eventType === 'user.updated') {
				await transaction
					.update(usersTable)
					.set({ name, email, image: data.image_url, updatedAt: new Date() })
					.where(
						and(
							eq(usersTable.id, existing.id),
							exists(
								transaction
									.select({ id: clerkIdentitiesTable.id })
									.from(clerkIdentitiesTable)
									.where(
										and(clerkIdentityCondition(key), eq(clerkIdentitiesTable.userId, existing.id)),
									),
							),
						),
					);
			}

			return { userId: existing.id, environment };
		}

		const result = await provisionClerkIdentity(transaction, { ...key, name, email, image: data.image_url });
		if (!result) {
			// E-mail já cadastrado: a associação deve ser autorizada fora do webhook.
			// Resposta 2xx evita retries infinitos de uma colisão intencionalmente bloqueada.
			return { ignored: true, reason: 'manual_identity_link_required' };
		}

		return { userId: result.user.id, environment };
	});
};

export async function POST(req: Request) {
	try {
		const signingSecret = process.env.CLERK_WEBHOOK_SECRET;
		if (!signingSecret) {
			throw new Error('CLERK_WEBHOOK_SECRET is not configured');
		}

		const svixId = req.headers.get('svix-id');
		const svixTimestamp = req.headers.get('svix-timestamp');
		const svixSignature = req.headers.get('svix-signature');

		if (!svixId || !svixTimestamp || !svixSignature) {
			return new Response('Missing Svix headers', { status: 400 });
		}

		const body = await req.text();
		let event: WebhookEvent;

		try {
			event = new Webhook(signingSecret).verify(body, {
				'svix-id': svixId,
				'svix-timestamp': svixTimestamp,
				'svix-signature': svixSignature,
			}) as WebhookEvent;
		} catch (error) {
			console.error('Could not verify Clerk webhook', error);
			return new Response('Webhook verification failed', { status: 400 });
		}

		if (event.type === 'user.created' || event.type === 'user.updated') {
			return NextResponse.json(await syncClerkUser(event.data, event.type));
		}

		if (event.type === 'user.deleted') {
			const clerkUserId = event.data.id;

			if (!clerkUserId) {
				return NextResponse.json({ error: 'No user ID provided' }, { status: 400 });
			}

			const [deletedIdentity] = await db
				.delete(clerkIdentitiesTable)
				.where(clerkIdentityCondition({ clerkUserId, environment: getClerkEnvironment() }))
				.returning({ userId: clerkIdentitiesTable.userId });

			return NextResponse.json({ identityRemoved: Boolean(deletedIdentity) });
		}

		return NextResponse.json({ ignored: true });
	} catch (error) {
		console.error('Failed to process Clerk webhook', error);
		return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
	}
}

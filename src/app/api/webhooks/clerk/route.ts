import { db } from '@/db';
import { clerkIdentitiesTable, usersTable } from '@/db/schema';
import { getClerkEnvironment } from '@/lib/integrations/clerk-environment';
import { UserJSON, WebhookEvent } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';

const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

const getPrimaryEmail = (data: UserJSON): string => {
	const email =
		data.email_addresses.find(
			(address) => address.id === data.primary_email_address_id,
		)?.email_address ?? data.email_addresses[0]?.email_address;

	if (!email) {
		throw new Error('Clerk user has no email address');
	}

	return email;
};

const getDisplayName = (data: UserJSON, email: string): string => {
	const name = [data.first_name, data.last_name].filter(Boolean).join(' ').trim();

	return name || email;
};

const syncClerkUser = async (data: UserJSON) => {
	const environment = getClerkEnvironment();
	const email = getPrimaryEmail(data);
	const name = getDisplayName(data, email);

	return db.transaction(async (transaction) => {
		const [existingIdentity] = await transaction
			.select({ userId: clerkIdentitiesTable.userId })
			.from(clerkIdentitiesTable)
			.where(eq(clerkIdentitiesTable.clerkUserId, data.id))
			.limit(1);

		let userId = existingIdentity?.userId;

		if (userId) {
			await transaction
				.update(usersTable)
				.set({
					name,
					email,
					image: data.image_url,
					updatedAt: new Date(),
				})
				.where(eq(usersTable.id, userId));
		} else {
			const [user] = await transaction
				.insert(usersTable)
				.values({
					name,
					email,
					image: data.image_url,
					isRegistrationComplete: false,
				})
				.onConflictDoUpdate({
					target: usersTable.email,
					set: {
						name,
						image: data.image_url,
						updatedAt: new Date(),
					},
				})
				.returning({ id: usersTable.id });

			if (!user) {
				throw new Error('Could not create or update local user');
			}

			userId = user.id;
		}

		await transaction
			.insert(clerkIdentitiesTable)
			.values({
				userId,
				environment,
				clerkUserId: data.id,
			})
			.onConflictDoUpdate({
				target: [
					clerkIdentitiesTable.userId,
					clerkIdentitiesTable.environment,
				],
				set: {
					clerkUserId: data.id,
					updatedAt: new Date(),
				},
			});

		return { userId, environment };
	});
};

export async function POST(req: Request) {
	try {
		if (!SIGNING_SECRET) {
			throw new Error('CLERK_WEBHOOK_SECRET is not configured');
		}

		const webhook = new Webhook(SIGNING_SECRET);
		const headerPayload = await headers();
		const svixId = headerPayload.get('svix-id');
		const svixTimestamp = headerPayload.get('svix-timestamp');
		const svixSignature = headerPayload.get('svix-signature');

		if (!svixId || !svixTimestamp || !svixSignature) {
			return new Response('Missing Svix headers', { status: 400 });
		}

		const payload: unknown = await req.json();
		const body = JSON.stringify(payload);

		let event: WebhookEvent;

		try {
			event = webhook.verify(body, {
				'svix-id': svixId,
				'svix-timestamp': svixTimestamp,
				'svix-signature': svixSignature,
			}) as WebhookEvent;
		} catch (error) {
			console.error('Could not verify Clerk webhook', error);
			return new Response('Webhook verification failed', { status: 400 });
		}

		if (event.type === 'user.created' || event.type === 'user.updated') {
			const result = await syncClerkUser(event.data as UserJSON);

			return NextResponse.json(result);
		}

		if (event.type === 'user.deleted') {
			const clerkUserId = event.data.id;

			if (!clerkUserId) {
				return NextResponse.json(
					{ error: 'No user ID provided' },
					{ status: 400 },
				);
			}

			const [deletedIdentity] = await db
				.delete(clerkIdentitiesTable)
				.where(eq(clerkIdentitiesTable.clerkUserId, clerkUserId))
				.returning({ userId: clerkIdentitiesTable.userId });

			return NextResponse.json({
				identityRemoved: Boolean(deletedIdentity),
			});
		}

		return NextResponse.json({ ignored: true });
	} catch (error) {
		console.error('Failed to process Clerk webhook', error);

		return NextResponse.json(
			{ error: 'Webhook processing failed' },
			{ status: 500 },
		);
	}
}

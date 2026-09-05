import { db } from '@/db';
import { usersTable } from '@/db/schema';
import { UserJSON, WebhookEvent } from '@clerk/nextjs/server';
import { normalizeUserRole } from '@/lib/security/roles';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';

const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: Request) {
	try {
		if (!SIGNING_SECRET) {
			throw new Error('Error: Clerk webhook secret not found');
		}

		const wh = new Webhook(SIGNING_SECRET);
		const headerPayload = await headers();
		const svix_id = headerPayload.get('svix-id');
		const svix_timestamp = headerPayload.get('svix-timestamp');
		const svix_signature = headerPayload.get('svix-signature');

		if (!svix_id || !svix_timestamp || !svix_signature) {
			return new Response('Error: Missing Svix headers', {
				status: 400,
			});
		}

		const payload = await req.json();
		const body = JSON.stringify(payload);

		let evt: WebhookEvent;

		try {
			evt = wh.verify(body, {
				'svix-id': svix_id,
				'svix-timestamp': svix_timestamp,
				'svix-signature': svix_signature,
			}) as WebhookEvent;
		} catch (err) {
			console.error('Error: Could not verify webhook:', err);
			return new Response('Error: Verification error', {
				status: 400,
			});
		}

		const { id: clerkUserId } = evt.data;

		if (!clerkUserId)
			return NextResponse.json(
				{ error: 'No user ID provided' },
				{ status: 400 },
			);

		let userResponse = null;

		const eventType = evt.type;

		switch (eventType) {
			case 'user.created': {
				const data = evt.data as UserJSON;
				const email =
					data.email_addresses.find(
						(addr) => addr.id === data.primary_email_address_id,
					)?.email_address ?? data.email_addresses[0]?.email_address;

				const role = normalizeUserRole(data.public_metadata.role);

				userResponse = await db
					.insert(usersTable)
					.values({
						name: `${data.first_name} ${data.last_name}`.trim(),
						email: email,
						image: data.image_url,
						clerkUserId: data.id,
						isRegistrationComplete: false,
						role: role,
					})
					.onConflictDoUpdate({
						target: usersTable.email,
						set: {
							name: `${data.first_name} ${data.last_name}`.trim(),
							image: data.image_url,
							clerkUserId: data.id,
							isRegistrationComplete: false,
							role,
							updatedAt: new Date(),
						},
					});
				break;
			}

			case 'user.updated': {
				const data = evt.data as UserJSON;
				const email =
					data.email_addresses.find(
						(addr) => addr.id === data.primary_email_address_id,
					)?.email_address ?? data.email_addresses[0]?.email_address;

				const role = normalizeUserRole(data.public_metadata.role);

				userResponse = await db
					.update(usersTable)
					.set({
						name: `${data.first_name} ${data.last_name}`.trim(),
						email: email,
						image: data.image_url,
						role,
						updatedAt: new Date(),
					})
					.where(eq(usersTable.clerkUserId, data.id));
				break;
			}

			case 'user.deleted': {
				const { id: clerkUserId } = evt.data;

				if (!clerkUserId) {
					return NextResponse.json(
						{ error: 'No user ID provided' },
						{ status: 400 },
					);
				}

				// 1. Verifica se o usuário existe no SEU banco
				const existingUser = await db.query.usersTable.findFirst({
					where: eq(usersTable.clerkUserId, clerkUserId),
				});

				if (!existingUser) {
					console.log(
						`Usuário ${clerkUserId} não encontrado no banco local. Pulando deleção.`,
					);
					return NextResponse.json({
						message: 'User not found localy, nothing to delete',
					});
				}

				// 2. Se existe, deleta (o cascade cuidará de client/veterinarian/etc)
				await db
					.delete(usersTable)
					.where(eq(usersTable.clerkUserId, clerkUserId));

				console.log(
					`Usuário ${clerkUserId} e seus dados vinculados foram removidos.`,
				);
				break;
			}
		}

		return NextResponse.json({ user: userResponse });
	} catch (error) {
		return NextResponse.json({ error }, { status: 500 });
	}
}

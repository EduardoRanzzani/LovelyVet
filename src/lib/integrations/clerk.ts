import 'server-only';

import type { CreateCustomerWithUserSchema } from '@/api/schema/customers.schema';
import type { CreateDoctorWithUserSchema } from '@/api/schema/doctors.schema';
import { CLERK_ERROR_MESSAGES } from '@/api/config/consts';
import { generateUsername } from '@/api/util';
import type { UserRole } from '@/lib/security/roles';
import { createClerkClient } from '@clerk/nextjs/server';
import { randomBytes } from 'crypto';

const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!clerkSecretKey) {
	throw new Error('CLERK_SECRET_KEY não configurada');
}

const clerkClient = createClerkClient({
	secretKey: clerkSecretKey,
});

interface ClerkErrorDetail {
	code: string;
	message: string;
	longMessage?: string;
	meta?: Record<string, unknown>;
}

interface ClerkResponseError {
	errors: ClerkErrorDetail[];
}

const isClerkAPIError = (error: unknown): error is ClerkResponseError => {
	return (
		typeof error === 'object' &&
		error !== null &&
		'errors' in error &&
		Array.isArray((error as ClerkResponseError).errors)
	);
};

const generateSecurePassword = (): string => {
	return `${randomBytes(24).toString('base64url')}Aa1!`;
};

export const createNewClerkUser = async (
	data: CreateCustomerWithUserSchema | CreateDoctorWithUserSchema,
	role: UserRole = 'customer',
) => {
	try {
		const nameParts = data.name.trim().split(/\s+/);

		const firstName = nameParts[0];
		const lastName =
			nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;

		const username = generateUsername(data.name);

		return await clerkClient.users.createUser({
			emailAddress: [data.email],
			firstName,
			lastName,
			username,
			password: generateSecurePassword(),
			publicMetadata: {
				role,
			},
		});
	} catch (error) {
		if (isClerkAPIError(error)) {
			const firstError = error.errors[0];

			const errorCode = firstError?.code;

			console.error('[Clerk Error]', errorCode ?? 'unknown_error');

			if (firstError) {
				const friendlyMessage =
					CLERK_ERROR_MESSAGES[firstError.code] ?? firstError.message;

				throw new Error(friendlyMessage);
			}
		}

		if (error instanceof Error) {
			throw new Error(error.message);
		}

		throw new Error('Erro inesperado ao criar usuário');
	}
};

export const updateClerkUserRole = async (
	clerkUserId: string,
	role: UserRole,
): Promise<void> => {
	try {
		await clerkClient.users.updateUserMetadata(clerkUserId, {
			publicMetadata: {
				role,
			},
		});
	} catch (error) {
		console.error('Falha ao atualizar role no Clerk');

		if (error instanceof Error) {
			throw new Error(error.message);
		}

		throw new Error('Erro inesperado ao atualizar usuário');
	}
};

import { auth } from '@clerk/nextjs/server';
import { cache } from 'react';
import type { UserRole } from './roles';
import { findUserByClerkUserId } from './user-identity';

export type AuthContext = {
	clerkUserId: string;
	userId: string;
	role: UserRole;
	customerId: string | null;
	doctorId: string | null;
};

const loadAuthContext = async (): Promise<AuthContext> => {
	const { userId: clerkUserId } = await auth();

	if (!clerkUserId) {
		throw new Error('Usuário não autenticado');
	}

	const user = await findUserByClerkUserId(clerkUserId);

	if (!user) {
		throw new Error('Usuário não cadastrado no sistema');
	}

	return {
		clerkUserId,
		userId: user.id,
		role: user.role,
		customerId: user.customer?.id ?? null,
		doctorId: user.doctor?.id ?? null,
	};
};

export const requireAuthContext = cache(loadAuthContext);

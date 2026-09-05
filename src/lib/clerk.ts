import type { UserRole } from '@/lib/security/roles';
import { auth } from '@clerk/nextjs/server';

export const checkRole = async (role: UserRole) => {
	const { sessionClaims } = await auth();
	return sessionClaims?.metadata.role === role;
};

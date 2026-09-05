import type { UserRole } from '@/lib/security/roles';

export {};

declare global {
	interface CustomJwtSessionClaims {
		metadata: {
			role?: UserRole;
		};
	}
}

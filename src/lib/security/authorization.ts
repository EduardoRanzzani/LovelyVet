import type { AuthContext } from './auth-context';
import type { UserRole } from './roles';

export const hasRole = (
	context: AuthContext,
	...roles: UserRole[]
): boolean => {
	return roles.includes(context.role);
};

export const requireRole = (
	context: AuthContext,
	...roles: UserRole[]
): void => {
	if (!hasRole(context, ...roles)) {
		throw new Error('Usuário não autorizado');
	}
};

export const requireAdmin = (context: AuthContext): void => {
	requireRole(context, 'admin');
};

export const requireStaff = (context: AuthContext): void => {
	requireRole(context, 'admin', 'doctor');
};

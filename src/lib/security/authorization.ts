import { redirect } from 'next/navigation';
import type { AuthContext } from './auth-context';
import { requireAuthContext } from './auth-context';
import { canAccessPath } from './permissions';
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

export const requirePageAccess = async (
	pathname: string,
): Promise<AuthContext> => {
	const context = await requireAuthContext();

	if (!canAccessPath(context.role, pathname)) {
		redirect('/dashboard');
	}

	return context;
};

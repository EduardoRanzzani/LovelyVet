export const USER_ROLES = ['admin', 'doctor', 'customer'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const DEFAULT_USER_ROLE: UserRole = 'customer';

export const isUserRole = (value: unknown): value is UserRole => {
	return typeof value === 'string' && USER_ROLES.includes(value as UserRole);
};

export const normalizeUserRole = (value: unknown): UserRole => {
	return isUserRole(value) ? value : DEFAULT_USER_ROLE;
};

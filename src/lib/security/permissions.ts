import type { UserRole } from '@/lib/security/roles';
import { isPathWithinRoute } from '@/lib/security/routes';

export const ROUTE_PERMISSIONS: Record<UserRole, readonly string[]> = {
	admin: [
		'/dashboard',
		'/doctors',
		'/pets',
		'/customers',
		'/breeds',
		'/species',
		'/services',
		'/appointments',
		'/agenda',
		'/prescriptions',
		'/clinical-documents/print',
		'/calculators',
		'/shifts',
		'/messages',
		'/admin',
		'/clinics',
		'/prescriptions-items',
	],
	doctor: [
		'/dashboard',
		'/pets',
		'/customers',
		'/breeds',
		'/species',
		'/services',
		'/appointments',
		'/agenda',
		'/prescriptions',
		'/clinical-documents/print',
		'/calculators',
		'/shifts',
		'/prescriptions-items',
	],
	customer: [
		'/dashboard',
		'/pets',
		'/appointments',
		'/prescriptions/print',
		'/clinical-documents/print',
	],
};

export const canAccessPath = (role: UserRole, pathname: string): boolean => {
	return ROUTE_PERMISSIONS[role].some((route) =>
		isPathWithinRoute(pathname, route),
	);
};

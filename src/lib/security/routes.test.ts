import { describe, expect, it } from 'vitest';

import { isPathWithinRoute } from '@/lib/security/routes';

describe('isPathWithinRoute', () => {
	it.each([
		['/admin', '/admin'],
		['/admin/users', '/admin'],
		['/pets/123/history', '/pets'],
	])('matches %s within %s', (pathname, route) => {
		expect(isPathWithinRoute(pathname, route)).toBe(true);
	});

	it.each([
		['/administrator', '/admin'],
		['/petshop', '/pets'],
		['/admin', '/admin/users'],
		['/pets', '/admin'],
	])('rejects %s outside %s', (pathname, route) => {
		expect(isPathWithinRoute(pathname, route)).toBe(false);
	});
});

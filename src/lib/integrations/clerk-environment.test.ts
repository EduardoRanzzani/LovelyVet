import { afterEach, describe, expect, it, vi } from 'vitest';

import { getClerkEnvironment } from './clerk-environment';

describe('getClerkEnvironment', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it.each(['development', 'production'] as const)(
		'accepts the %s environment',
		(environment) => {
			vi.stubEnv('CLERK_ENVIRONMENT', environment);

			expect(getClerkEnvironment()).toBe(environment);
		},
	);

	it.each([undefined, '', 'test', 'prod']) (
		'rejects invalid environment %j',
		(environment) => {
			vi.stubEnv('CLERK_ENVIRONMENT', environment ?? '');

			expect(() => getClerkEnvironment()).toThrow(
				'CLERK_ENVIRONMENT deve ser "development" ou "production".',
			);
		},
	);
});

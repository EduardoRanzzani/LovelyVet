export const CLERK_ENVIRONMENTS = ['development', 'production'] as const;

export type ClerkEnvironment = (typeof CLERK_ENVIRONMENTS)[number];

export const getClerkEnvironment = (): ClerkEnvironment => {
	const environment = process.env.CLERK_ENVIRONMENT;

	if (
		environment !== 'development' &&
		environment !== 'production'
	) {
		throw new Error(
			'CLERK_ENVIRONMENT deve ser "development" ou "production".',
		);
	}

	return environment;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const toInteger = (
	value: number | string | null | undefined,
	fallback: number,
): number => {
	const parsed = typeof value === 'number' ? value : Number(value);

	if (!Number.isFinite(parsed)) {
		return fallback;
	}

	return Math.trunc(parsed);
};

export const normalizePagination = (
	page?: number | string | null,
	limit?: number | string | null,
) => {
	const normalizedPage = Math.max(1, toInteger(page, DEFAULT_PAGE));

	const normalizedLimit = Math.min(
		MAX_LIMIT,
		Math.max(1, toInteger(limit, DEFAULT_LIMIT)),
	);

	return {
		page: normalizedPage,
		limit: normalizedLimit,
		offset: (normalizedPage - 1) * normalizedLimit,
	};
};

'use server';

import { db } from '@/db';
import { speciesTable } from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { asc, count, eq, ilike, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import z from 'zod';
import { PaginatedData } from '../config/consts';
import { createSpecieSchema, Species } from '../schema/species.schema';

export const getSpecies = async (): Promise<Species[]> => {
	await requireAuthContext();
	const species = await db.query.speciesTable.findMany({
		orderBy: asc(speciesTable.name),
	});
	return species;
};

export const getSpeciesPaginated = async (
	page: number,
	limit: number,
	search?: string,
): Promise<PaginatedData<Species>> => {
	const context = await requireAuthContext();
	requireStaff(context);

	const offset = (page - 1) * limit;

	const filterCondition = search
		? or(ilike(speciesTable.name, `%${search}%`))
		: undefined;

	const dataPromise = db
		.select({
			speciesTable: speciesTable,
		})
		.from(speciesTable)
		.where(filterCondition)
		.limit(limit)
		.offset(offset)
		.orderBy(asc(speciesTable.name));

	const totalCountPromise = db
		.select({ value: count() })
		.from(speciesTable)
		.where(filterCondition);

	const [data, totalCountResult] = await Promise.all([
		dataPromise,
		totalCountPromise,
	]);

	const totalCount = totalCountResult[0].value;
	const pageCount = Math.ceil(totalCount / limit);

	const formattedData = data.map((row) => ({
		...row.speciesTable,
	}));

	return {
		data: formattedData,
		metadata: {
			totalCount,
			pageCount,
			currentPage: page,
			limit,
		},
	};
};

export const upsertSpecie = actionClient
	.schema(createSpecieSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireStaff(context);

		await db
			.insert(speciesTable)
			.values({
				id: parsedInput.id ?? undefined,
				name: parsedInput.name,
			})
			.onConflictDoUpdate({
				target: speciesTable.id, // O conflito ocorre no ID
				set: {
					name: parsedInput.name,
				},
			})
			.returning();

		revalidatePath('/species');
	});

export const deleteSpecie = actionClient
	.schema(z.object({ id: z.uuid() }))
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireStaff(context);

		const specie = await db.query.speciesTable.findFirst({
			where: eq(speciesTable.id, parsedInput.id),
		});

		if (!specie) throw new Error('Espécie não encontrada');

		await db.delete(speciesTable).where(eq(speciesTable.id, parsedInput.id));

		revalidatePath('/species');
	});

'use server';

import { db } from '@/db';
import { breedsTable, speciesTable } from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { currentUser } from '@clerk/nextjs/server';
import { asc, count, eq, ilike, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import z from 'zod';
import { PaginatedData } from '../config/consts';
import {
	BreedsWithRelations,
	createBreedSchema,
} from '../schema/breeds.schema';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';

export const getBreeds = async (): Promise<BreedsWithRelations[]> => {
	const breeds = await db.query.breedsTable.findMany({
		with: {
			specie: true,
		},
		orderBy: asc(breedsTable.name),
	});

	return breeds;
};

export const getBreedsPaginated = async (
	page: number,
	limit: number,
	search?: string,
): Promise<PaginatedData<BreedsWithRelations>> => {
	const authenticatedUser = await currentUser();
	if (!authenticatedUser) throw new Error('Usuário não autenticado');

	const offset = (page - 1) * limit;

	const filterCondition = search
		? or(
				ilike(breedsTable.name, `%${search}%`),
				ilike(speciesTable.name, `%${search}%`),
			)
		: undefined;

	const dataPromise = db
		.select({
			breedsTable: breedsTable,
			speciesTable: speciesTable,
		})
		.from(breedsTable)
		.innerJoin(speciesTable, eq(breedsTable.specieId, speciesTable.id))
		.where(filterCondition)
		.limit(limit)
		.offset(offset)
		.orderBy(asc(breedsTable.name));

	const totalCountPromise = db
		.select({ value: count() })
		.from(breedsTable)
		.innerJoin(speciesTable, eq(breedsTable.specieId, speciesTable.id))
		.where(filterCondition);

	const [data, totalCountResult] = await Promise.all([
		dataPromise,
		totalCountPromise,
	]);

	const totalCount = totalCountResult[0].value;
	const pageCount = Math.ceil(totalCount / limit);

	const formattedData = data.map((row) => ({
		...row.breedsTable,
		specie: row.speciesTable,
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

export const upsertBreed = actionClient
	.schema(createBreedSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireStaff(context);

		await db
			.insert(breedsTable)
			.values({
				id: parsedInput.id ?? undefined,
				name: parsedInput.name,
				specieId: parsedInput.specieId,
			})
			.onConflictDoUpdate({
				target: breedsTable.id,
				set: {
					name: parsedInput.name,
					specieId: parsedInput.specieId,
				},
			})
			.returning();

		revalidatePath('/breeds');
	});

export const deleteBreed = actionClient
	.schema(z.object({ id: z.string() }))
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireStaff(context);

		const breed = await db.query.breedsTable.findFirst({
			where: eq(breedsTable.id, parsedInput.id),
		});

		if (!breed) throw new Error('Raça não encontrada');

		await db.delete(breedsTable).where(eq(breedsTable.id, parsedInput.id));

		revalidatePath('/breeds');
	});

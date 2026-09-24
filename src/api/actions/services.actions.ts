'use server';

import { db } from '@/db';
import { servicesTable, speciesTable } from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { asc, count, eq, ilike, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import z from 'zod';
import { MAX_PAGE_SIZE, PaginatedData } from '../config/consts';
import { normalizePagination } from '@/lib/pagination';
import { toCents } from '@/lib/money/currency';
import {
	createServiceSchema,
	ServicesWithRelations,
} from '../schema/services.schema';

export const getServices = async (): Promise<ServicesWithRelations[]> => {
	await requireAuthContext();

	const data = await db.query.servicesTable.findMany({
		with: { specie: true },
	});
	return data as ServicesWithRelations[];
};

export const getServicesPaginated = async (
	page: number = 1,
	limit: number = MAX_PAGE_SIZE,
	search?: string,
): Promise<PaginatedData<ServicesWithRelations>> => {
	const context = await requireAuthContext();
	requireStaff(context);

	const pagination = normalizePagination(page, limit);

	const filterCondition = search
		? or(
				ilike(servicesTable.name, `%${search}%`),
				ilike(servicesTable.description, `%${search}%`),
			)
		: undefined;

	const data = await db.query.servicesTable.findMany({
		where: filterCondition,
		limit: pagination.limit,
		offset: pagination.offset,
		orderBy: asc(servicesTable.name),
		with: { specie: true },
	});

	const totalCountResult = await db
		.select({ value: count() })
		.from(servicesTable)
		.leftJoin(speciesTable, eq(servicesTable.specieId, speciesTable.id))
		.where(filterCondition);

	const totalCount = Number(totalCountResult[0]?.value ?? 0);
	const pageCount = Math.ceil(totalCount / pagination.limit);
	return {
		data: data as ServicesWithRelations[],
		metadata: {
			totalCount,
			pageCount,
			currentPage: pagination.page,
			limit: pagination.limit,
		},
	};
};

export const upsertService = actionClient
	.schema(createServiceSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireStaff(context);

		// Verifica se a especie foi preenchida, caso contrário salva null no banco
		const specieId = parsedInput?.specieId === '' ? null : parsedInput.specieId;
		const priceInCents = toCents(parsedInput.price);

		await db
			.insert(servicesTable)
			.values({
				id: parsedInput.id ?? undefined,
				name: parsedInput.name,
				description: parsedInput.description,
				specieId,
				priceInCents,
			})
			.onConflictDoUpdate({
				target: servicesTable.id,
				set: {
					name: parsedInput.name,
					description: parsedInput.description,
					specieId,
					priceInCents,
					updatedAt: new Date(),
				},
			});

		revalidatePath('/services');
	});

export const deleteService = actionClient
	.schema(z.object({ id: z.string() }))
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireStaff(context);

		const service = await db.query.servicesTable.findFirst({
			where: eq(servicesTable.id, parsedInput.id),
		});

		if (!service) throw new Error('Serviço não encontrado');

		await db.delete(servicesTable).where(eq(servicesTable.id, parsedInput.id));

		revalidatePath('/services');
	});

'use server';

import { db } from '@/db';
import { clinicsTable } from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { asc, count, eq, ilike, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import z from 'zod';
import { PaginatedData } from '../config/consts';
import {
	Clinics,
	ClinicShiftOption,
	createClinicSchema,
} from '../schema/clinics.schema';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireAdmin, requireStaff } from '@/lib/security/authorization';
import { normalizePagination } from '@/lib/pagination';
import { toCents } from '@/lib/money/currency';

export const getClinicsPaginated = async (
	page: number,
	limit: number,
	search?: string,
): Promise<PaginatedData<Clinics>> => {
	const context = await requireAuthContext();
	requireAdmin(context);

	const pagination = normalizePagination(page, limit);

	const filterConditions = search
		? or(ilike(clinicsTable.name, `%${search}%`))
		: undefined;

	const dataPromise = db
		.select({
			clinicsTable: clinicsTable,
		})
		.from(clinicsTable)
		.where(filterConditions)
		.limit(pagination.limit)
		.offset(pagination.offset)
		.orderBy(asc(clinicsTable.name));

	const totalCountPromise = db
		.select({ value: count() })
		.from(clinicsTable)
		.where(filterConditions);

	const [data, totalCountResult] = await Promise.all([
		dataPromise,
		totalCountPromise,
	]);

	const totalCount = totalCountResult[0].value;
	const pageCount = Math.ceil(totalCount / pagination.limit);

	const formattedData = data.map((row) => ({
		...row.clinicsTable,
	}));

	return {
		data: formattedData,
		metadata: {
			totalCount,
			pageCount,
			currentPage: pagination.page,
			limit: pagination.limit,
		},
	};
};

export const getClinicsForShiftSelection = async (): Promise<
	ClinicShiftOption[]
> => {
	const context = await requireAuthContext();
	requireStaff(context);

	return db
		.select({
			id: clinicsTable.id,
			name: clinicsTable.name,
			defaultShiftPriceInCents: clinicsTable.defaultShiftPriceInCents,
			isActive: clinicsTable.isActive,
		})
		.from(clinicsTable)
		.orderBy(asc(clinicsTable.name));
};

export const upsertClinic = actionClient
	.schema(createClinicSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireAdmin(context);

		// Converta para centavos uma única vez
		const priceInCents = toCents(parsedInput.defaultShiftPriceInCents);

		await db
			.insert(clinicsTable)
			.values({
				id: parsedInput.id ?? undefined,
				name: parsedInput.name,
				phone: parsedInput.phone,
				defaultShiftPriceInCents: priceInCents,
				isActive: parsedInput.isActive ?? true,
				postalCode: parsedInput.postalCode,
				neighborhood: parsedInput.neighborhood,
				address: parsedInput.address,
				addressNumber: parsedInput.addressNumber,
				city: parsedInput.city,
				state: parsedInput.state,
			})
			.onConflictDoUpdate({
				target: clinicsTable.id,
				set: {
					name: parsedInput.name,
					phone: parsedInput.phone,
					defaultShiftPriceInCents: priceInCents,
					isActive: parsedInput.isActive,
					updatedAt: new Date(),
					postalCode: parsedInput.postalCode,
					neighborhood: parsedInput.neighborhood,
					address: parsedInput.address,
					addressNumber: parsedInput.addressNumber,
					city: parsedInput.city,
					state: parsedInput.state,
				},
			});

		revalidatePath('/clinics');
	});

export const deleteClinic = actionClient
	.schema(z.object({ id: z.uuid() }))
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireAdmin(context);

		const clinic = await db.query.clinicsTable.findFirst({
			where: eq(clinicsTable.id, parsedInput.id),
		});

		if (!clinic) throw new Error('Clínica não encontrada');

		await db.delete(clinicsTable).where(eq(clinicsTable.id, parsedInput.id));

		revalidatePath('/clinics');
	});

'use server';

import { db } from '@/db';
import { clinicsTable } from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { asc, count, eq, ilike, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import z from 'zod';
import { PaginatedData } from '../config/consts';
import { Clinics, createClinicSchema } from '../schema/clinics.schema';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireAdmin } from '@/lib/security/authorization';

export const getClinicsPaginated = async (
	page: number,
	limit: number,
	search?: string,
): Promise<PaginatedData<Clinics>> => {
	const offset = (page - 1) * limit;

	const filterConditions = search
		? or(ilike(clinicsTable.name, `%${search}%`))
		: undefined;

	const dataPromise = db
		.select({
			clinicsTable: clinicsTable,
		})
		.from(clinicsTable)
		.where(filterConditions)
		.limit(limit)
		.offset(offset)
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
	const pageCount = Math.ceil(totalCount / limit);

	const formattedData = data.map((row) => ({
		...row.clinicsTable,
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

export const upsertClinic = actionClient
	.schema(createClinicSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireAdmin(context);

		// Converta para centavos uma única vez
		const priceInCents = Math.round(parsedInput.defaultShiftPriceInCents * 100);

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

'use server';
import { db } from '@/db';
import { prescriptionItemsTable } from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { currentUser } from '@clerk/nextjs/server';
import { asc, count, eq, ilike, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import z from 'zod';
import { MAX_PAGE_SIZE, PaginatedData } from '../config/consts';
import {
	createPrescriptionItemSchema,
	PrescriptionItemsWithRelations,
} from '../schema/prescriptions-items.schema';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { sanitizeRichTextHtml } from '@/lib/security/html';

export const getPrescriptionsItems = async () => {
	const authenticatedUser = await currentUser();
	if (!authenticatedUser) throw new Error('Nenhum usuário autenticado');

	return await db.query.prescriptionItemsTable.findMany();
};

export const getPrescriptionsItemsPaginated = async (
	page: number = 1,
	limit: number = MAX_PAGE_SIZE,
	search?: string,
): Promise<PaginatedData<PrescriptionItemsWithRelations>> => {
	const authenticatedUser = await currentUser();
	if (!authenticatedUser) throw new Error('Nenhum usuário autenticado');

	const offset = (page - 1) * limit;

	const filterCondition = search
		? or(
				ilike(prescriptionItemsTable.name, `%${search}%`),
				ilike(prescriptionItemsTable.orientations, `%${search}%`),
			)
		: undefined;

	const data = await db.query.prescriptionItemsTable.findMany({
		where: filterCondition,
		limit: limit,
		offset: offset,
		orderBy: asc(prescriptionItemsTable.name),
	});

	const totalCountResult = await db
		.select({ value: count() })
		.from(prescriptionItemsTable)
		.where(filterCondition);

	const totalCount = Number(totalCountResult[0]?.value ?? 0);
	const pageCount = Math.ceil(totalCount / limit);

	return {
		data: data as PrescriptionItemsWithRelations[],
		metadata: {
			totalCount,
			pageCount,
			currentPage: page,
			limit,
		},
	};
};

export const upsertPrescriptionItems = actionClient
	.schema(createPrescriptionItemSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireStaff(context);

		const orientations = sanitizeRichTextHtml(parsedInput.orientations);

		if (!orientations.trim()) {
			throw new Error('Orientações inválidas');
		}

		await db
			.insert(prescriptionItemsTable)
			.values({
				id: parsedInput.id ?? undefined,
				name: parsedInput.name,
				pharmacy: parsedInput.pharmacy,
				quantity: parsedInput.quantity,
				orientations,
			})
			.onConflictDoUpdate({
				target: prescriptionItemsTable.id,
				set: {
					name: parsedInput.name,
					pharmacy: parsedInput.pharmacy,
					quantity: parsedInput.quantity,
					orientations,
				},
			});

		revalidatePath('/prescriptions');
	});

export const deletePrescriptionItem = actionClient
	.schema(z.object({ id: z.string() }))
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireStaff(context);

		const item = await db.query.prescriptionItemsTable.findFirst({
			where: eq(prescriptionItemsTable.id, parsedInput.id),
		});

		if (!item) throw new Error('Item de receita não encontrado');

		await db
			.delete(prescriptionItemsTable)
			.where(eq(prescriptionItemsTable.id, parsedInput.id));

		revalidatePath('/prescriptions');
	});

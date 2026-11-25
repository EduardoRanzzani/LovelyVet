'use server';
import { db } from '@/db';
import { productsTable } from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { asc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import z from 'zod';

export const getProducts = async () => {
	const context = await requireAuthContext();
	requireStaff(context);
	return db.query.productsTable.findMany({ orderBy: asc(productsTable.name) });
};
const productSchema = z.object({
	id: z.uuid().optional(),
	name: z.string().trim().min(2).max(120),
	priceInCents: z.number().int().min(0).max(100_000_000),
	active: z.boolean().default(true),
});
export const saveProduct = actionClient.schema(productSchema).action(async ({ parsedInput }) => {
	const context = await requireAuthContext();
	requireStaff(context);
	const { id, ...data } = parsedInput;
	if (id) {
		const [updated] = await db
			.update(productsTable)
			.set(data)
			.where(eq(productsTable.id, id))
			.returning({ id: productsTable.id });
		if (!updated) throw new Error('Produto não encontrado.');
	} else {
		await db.insert(productsTable).values(data);
	}
	revalidatePath('/products');
	revalidatePath('/appointments');
});

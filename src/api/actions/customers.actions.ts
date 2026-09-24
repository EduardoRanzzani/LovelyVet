'use server';

import { db } from '@/db';
import { clerkIdentitiesTable, customersTable, usersTable } from '@/db/schema';
import { createNewClerkUser } from '@/lib/integrations/clerk';
import { getClerkEnvironment } from '@/lib/integrations/clerk-environment';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireRole, requireStaff } from '@/lib/security/authorization';
import { endOfMonth, startOfMonth } from 'date-fns';
import { and, asc, count, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import z from 'zod';
import { monthNames, PaginatedData } from '../config/consts';
import { normalizePagination } from '@/lib/pagination';
import {
	createCustomerWithUserSchema,
	CustomersWithRelations,
	onboardingCustomerSchema,
} from '../schema/customers.schema';

export const onboardingCustomer = actionClient
	.schema(onboardingCustomerSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireRole(context, 'customer');

		const existingCustomer = await db.query.customersTable.findFirst({
			where: eq(customersTable.userId, context.userId),
		});

		const cpfOwner = await db.query.customersTable.findFirst({
			where: eq(customersTable.cpf, parsedInput.cpf),
		});

		if (cpfOwner && cpfOwner.userId !== context.userId) {
			throw new Error('CPF já cadastrado para outro cliente');
		}

		const customerData = {
			phone: parsedInput.phone,
			cpf: parsedInput.cpf,
			gender: parsedInput.gender,
			postalCode: parsedInput.postalCode,
			address: parsedInput.address,
			addressNumber: parsedInput.addressNumber || 'S/N',
			neighborhood: parsedInput.neighborhood,
			city: parsedInput.city,
			state: parsedInput.state,
		};

		if (existingCustomer) {
			await db
				.update(customersTable)
				.set({
					...customerData,
					updatedAt: new Date(),
				})
				.where(eq(customersTable.id, existingCustomer.id));
		} else {
			await db.insert(customersTable).values({
				userId: context.userId,
				...customerData,
			});
		}

		revalidatePath('/customers');
	});

export const getCustomers = async (): Promise<CustomersWithRelations[]> => {
	const context = await requireAuthContext();
	requireStaff(context);

	// Usando select tradicional para permitir o join e a ordenação por outra tabela
	const customers = await db
		.select()
		.from(customersTable)
		.leftJoin(usersTable, eq(customersTable.userId, usersTable.id))
		.orderBy(asc(usersTable.name));

	return customers.map((row) => ({
		...row.customers,
		user: row.users,
	})) as CustomersWithRelations[];
};

export const getCreatedCustomers = async (
	monthName?: string,
): Promise<CustomersWithRelations[]> => {
	const context = await requireAuthContext();
	requireStaff(context);

	const now = new Date();
	const year = now.getFullYear();

	const monthIndex = monthName
		? monthNames.indexOf(monthName.toLowerCase())
		: now.getMonth();

	const safeMonthIndex = monthIndex === -1 ? now.getMonth() : monthIndex;

	const referenceDate = new Date(year, safeMonthIndex, 1);
	const startRange = startOfMonth(referenceDate);
	const endRange = endOfMonth(referenceDate);

	const customers = await db.query.customersTable.findMany({
		where: and(
			lte(customersTable.createdAt, endRange),
			gte(customersTable.createdAt, startRange),
		),
		with: { user: true },
	});

	return customers as CustomersWithRelations[];
};

export const getCustomersPaginated = async (
	page: number = 1,
	limit: number = 20,
	search?: string,
): Promise<PaginatedData<CustomersWithRelations>> => {
	const context = await requireAuthContext();
	requireStaff(context);

	const pagination = normalizePagination(page, limit);

	const filterCondition = search
		? or(
				ilike(usersTable.name, `%${search}%`),
				ilike(usersTable.email, `%${search}%`),
				ilike(customersTable.cpf, `%${search}%`),
				ilike(customersTable.phone, `%${search}%`),
				ilike(customersTable.address, `%${search}%`),
			)
		: undefined;

	const dataPromise = db
		.select({ customersTable, usersTable })
		.from(customersTable)
		.innerJoin(usersTable, sql`${customersTable.userId} = ${usersTable.id}`)
		.where(filterCondition)
		.limit(pagination.limit)
		.offset(pagination.offset)
		.orderBy(asc(usersTable.name));

	const totalCountPromise = db
		.select({ value: count() })
		.from(customersTable)
		.innerJoin(usersTable, sql`${customersTable.userId} = ${usersTable.id}`)
		.where(filterCondition);

	const [data, totalCountResult] = await Promise.all([
		dataPromise,
		totalCountPromise,
	]);

	const totalCount = totalCountResult[0].value;
	const pageCount = Math.ceil(totalCount / pagination.limit);

	const formattedData = data.map((row) => ({
		...row.customersTable,
		user: row.usersTable,
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

export const upsertCustomer = actionClient
	.schema(createCustomerWithUserSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireStaff(context);
		const clerkEnvironment = getClerkEnvironment();

		const existingCustomer = parsedInput.id
			? await db.query.customersTable.findFirst({
					where: eq(customersTable.id, parsedInput.id),
					with: { user: true },
				})
			: null;

		if (parsedInput.id && !existingCustomer) {
			throw new Error('Cliente não encontrado');
		}

		const cpfOwner = await db.query.customersTable.findFirst({
			where: eq(customersTable.cpf, parsedInput.cpf),
		});

		if (cpfOwner && cpfOwner.id !== existingCustomer?.id) {
			throw new Error('CPF já cadastrado para outro cliente');
		}

		const existingUser =
			existingCustomer?.user ??
			(await db.query.usersTable.findFirst({
				where: eq(usersTable.email, parsedInput.email),
			}));

		if (!existingCustomer && existingUser) {
			const linkedCustomer = await db.query.customersTable.findFirst({
				where: eq(customersTable.userId, existingUser.id),
			});

			if (linkedCustomer) {
				throw new Error('Usuário já possui um cadastro de cliente');
			}
		}

		const newClerkUser = existingUser
			? null
			: await createNewClerkUser(parsedInput);

		await db.transaction(async (transaction) => {
			const userRows = existingUser
				? await transaction
						.update(usersTable)
						.set({
							name: parsedInput.name,
							email: parsedInput.email,
							image: parsedInput.image,
							updatedAt: new Date(),
						})
						.where(eq(usersTable.id, existingUser.id))
						.returning()
				: await transaction
						.insert(usersTable)
						.values({
							name: parsedInput.name,
							email: parsedInput.email,
							image: parsedInput.image,
							role: 'customer',
						})
						.onConflictDoUpdate({
							target: usersTable.email,
							set: {
								name: parsedInput.name,
								image: parsedInput.image,
								updatedAt: new Date(),
							},
						})
						.returning();

			const [user] = userRows;

			if (!user) {
				throw new Error('Falha ao criar usuário base no sistema');
			}

			if (newClerkUser) {
				await transaction
					.insert(clerkIdentitiesTable)
					.values({
						userId: user.id,
						environment: clerkEnvironment,
						clerkUserId: newClerkUser.id,
					})
					.onConflictDoUpdate({
						target: [
							clerkIdentitiesTable.userId,
							clerkIdentitiesTable.environment,
						],
						set: {
							clerkUserId: newClerkUser.id,
							updatedAt: new Date(),
						},
					});
			}

			const customerData = {
				userId: user.id,
				phone: parsedInput.phone,
				cpf: parsedInput.cpf,
				gender: parsedInput.gender,
				postalCode: parsedInput.postalCode,
				address: parsedInput.address,
				addressNumber: parsedInput.addressNumber || 'S/N',
				neighborhood: parsedInput.neighborhood,
				city: parsedInput.city,
				state: parsedInput.state,
			};

			if (existingCustomer) {
				await transaction
					.update(customersTable)
					.set({ ...customerData, updatedAt: new Date() })
					.where(eq(customersTable.id, existingCustomer.id));
			} else {
				await transaction.insert(customersTable).values(customerData);
			}
		});

		revalidatePath('/customers');
	});

export const deleteCustomer = actionClient
	.schema(z.object({ id: z.uuid() }))
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireStaff(context);

		const customer = await db.query.customersTable.findFirst({
			where: eq(customersTable.id, parsedInput.id),
		});

		if (!customer) throw new Error('Cliente não encontrado');

		await db
			.delete(customersTable)
			.where(eq(customersTable.id, parsedInput.id));

		revalidatePath('/customers');
	});

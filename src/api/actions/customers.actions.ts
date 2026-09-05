'use server';

import { db } from '@/db';
import { customersTable, usersTable } from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireRole, requireStaff } from '@/lib/security/authorization';
import { endOfMonth, startOfMonth } from 'date-fns';
import { and, asc, count, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import z from 'zod';
import { monthNames, PaginatedData } from '../config/consts';
import {
	createCustomerWithUserSchema,
	CustomersWithRelations,
	onboardingCustomerSchema,
} from '../schema/customers.schema';
import { createNewClerkUser } from './clerk.actions';

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

	const offset = (page - 1) * limit;

	// 1. Construir a condição de filtro
	// Buscamos no nome do usuário (tabela user) ou no CPF do cliente
	const filterCondition = search
		? or(
				ilike(usersTable.name, `%${search}%`),
				ilike(usersTable.email, `%${search}%`),
				ilike(customersTable.cpf, `%${search}%`),
				ilike(customersTable.phone, `%${search}%`),
				ilike(customersTable.address, `%${search}%`),
			)
		: undefined;

	// 2. Query Principal com Inner Join para garantir que temos o User e podemos filtrar por ele
	const dataPromise = db
		.select({
			customersTable: customersTable,
			usersTable: usersTable,
		})
		.from(customersTable)
		.innerJoin(usersTable, sql`${customersTable.userId} = ${usersTable.id}`)
		.where(filterCondition)
		.limit(limit)
		.offset(offset)
		.orderBy(asc(usersTable.name));

	// 3. Contagem Total (precisa do join para o filtro de nome funcionar)
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
	const pageCount = Math.ceil(totalCount / limit);

	// Mapeamos o resultado para um formato mais amigável, similar ao findMany
	const formattedData = data.map((row) => ({
		...row.customersTable,
		user: row.usersTable,
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

export const upsertCustomer = actionClient
	.schema(createCustomerWithUserSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireStaff(context);

		let clerkUserId;

		const existingUser = await db.query.usersTable.findFirst({
			where: eq(usersTable.email, parsedInput.email),
		});

		if (existingUser) {
			clerkUserId = existingUser.clerkUserId;
		} else {
			const newClerkUser = await createNewClerkUser(parsedInput);
			clerkUserId = newClerkUser.id;
		}

		const [newUser] = await db
			.insert(usersTable)
			.values({
				name: parsedInput.name,
				email: parsedInput.email,
				image: parsedInput.image,
				clerkUserId: clerkUserId,
				role: 'customer',
			})
			.onConflictDoUpdate({
				target: usersTable.clerkUserId,
				set: {
					name: parsedInput.name,
					email: parsedInput.email,
					image: parsedInput.image,
					updatedAt: new Date(),
				},
			})
			.returning();

		if (!newUser) throw new Error('Falha ao criar usuário base no sistema');

		await db
			.insert(customersTable)
			.values({
				userId: newUser.id,
				phone: parsedInput.phone,
				cpf: parsedInput.cpf,
				gender: parsedInput.gender,
				postalCode: parsedInput.postalCode,
				address: parsedInput.address,
				addressNumber: parsedInput.addressNumber || 'S/N',
				neighborhood: parsedInput.neighborhood,
				city: parsedInput.city,
				state: parsedInput.state,
			})
			.onConflictDoUpdate({
				target: customersTable.cpf,
				set: {
					userId: newUser.id,
					phone: parsedInput.phone,
					cpf: parsedInput.cpf,
					gender: parsedInput.gender,
					postalCode: parsedInput.postalCode,
					address: parsedInput.address,
					addressNumber: parsedInput.addressNumber || 'S/N',
					neighborhood: parsedInput.neighborhood,
					city: parsedInput.city,
					state: parsedInput.state,
					updatedAt: new Date(),
				},
			})
			.returning();

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

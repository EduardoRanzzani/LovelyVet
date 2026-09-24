'use server';

import { db } from '@/db';
import { clerkIdentitiesTable, doctorsTable, usersTable } from '@/db/schema';
import { createNewClerkUser } from '@/lib/integrations/clerk';
import { getClerkEnvironment } from '@/lib/integrations/clerk-environment';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireAdmin, requireStaff } from '@/lib/security/authorization';
import { asc, count, eq, ilike, or, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import z from 'zod';
import { MAX_PAGE_SIZE, PaginatedData } from '../config/consts';
import type { DoctorOption } from '../schema/doctors.schema';
import { normalizePagination } from '@/lib/pagination';
import {
	createDoctorWithUserSchema,
	DoctorsWithRelations,
} from '../schema/doctors.schema';

export const getDoctors = async (): Promise<DoctorsWithRelations[]> => {
	const context = await requireAuthContext();
	requireStaff(context);

	const data = await db
		.select({
			doctors: doctorsTable,
			users: usersTable,
		})
		.from(doctorsTable)
		.innerJoin(usersTable, sql`${doctorsTable.userId} = ${usersTable.id}`)
		.orderBy(asc(usersTable.name));

	const formattedData: DoctorsWithRelations[] = data.map((row) => ({
		...row.doctors,
		user: row.users,
	}));

	return formattedData;
};

export const getDoctorsPaginated = async (
	page: number = 1,
	limit: number = MAX_PAGE_SIZE,
	search?: string,
): Promise<PaginatedData<DoctorsWithRelations>> => {
	const context = await requireAuthContext();
	requireAdmin(context);

	const pagination = normalizePagination(page, limit);
	const filterCondition = search
		? or(
				ilike(usersTable.name, `%${search}%`),
				ilike(doctorsTable.cpf, `%${search}%`),
				ilike(doctorsTable.phone, `%${search}%`),
				ilike(usersTable.email, `%${search}%`),
			)
		: undefined;

	const dataPromise = db
		.select({
			doctorsTable: doctorsTable,
			usersTable: usersTable,
		})
		.from(doctorsTable)
		.innerJoin(usersTable, sql`${doctorsTable.userId} = ${usersTable.id}`)
		.where(filterCondition)
		.limit(pagination.limit)
		.offset(pagination.offset)
		.orderBy(asc(usersTable.name));

	const totalCountPromise = db
		.select({ value: count() })
		.from(doctorsTable)
		.innerJoin(usersTable, sql`${doctorsTable.userId} = ${usersTable.id}`)
		.where(filterCondition);

	const [data, totalCountResult] = await Promise.all([
		dataPromise,
		totalCountPromise,
	]);

	const totalCount = Number(totalCountResult[0]?.value ?? 0);
	const pageCount = Math.ceil(totalCount / pagination.limit);

	const formattedData = data.map((row) => ({
		...row.doctorsTable,
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

export const upsertDoctor = actionClient
	.schema(createDoctorWithUserSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireAdmin(context);
		const clerkEnvironment = getClerkEnvironment();

		const existingDoctor = parsedInput.id
			? await db.query.doctorsTable.findFirst({
					where: eq(doctorsTable.id, parsedInput.id),
					with: { user: true },
				})
			: null;

		if (parsedInput.id && !existingDoctor) {
			throw new Error('Veterinário não encontrado');
		}

		const cpfOwner = await db.query.doctorsTable.findFirst({
			where: eq(doctorsTable.cpf, parsedInput.cpf),
		});

		if (cpfOwner && cpfOwner.id !== existingDoctor?.id) {
			throw new Error('CPF já cadastrado para outro veterinário');
		}

		const existingUser =
			existingDoctor?.user ??
			(await db.query.usersTable.findFirst({
				where: eq(usersTable.email, parsedInput.email),
			}));

		if (!existingDoctor && existingUser) {
			const linkedDoctor = await db.query.doctorsTable.findFirst({
				where: eq(doctorsTable.userId, existingUser.id),
			});

			if (linkedDoctor) {
				throw new Error('Usuário já possui um cadastro de veterinário');
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
							role: 'doctor',
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
							role: 'doctor',
						})
						.onConflictDoUpdate({
							target: usersTable.email,
							set: {
								name: parsedInput.name,
								image: parsedInput.image,
								role: 'doctor',
								updatedAt: new Date(),
							},
						})
						.returning();

			const [user] = userRows;

			if (!user) throw new Error('Falha ao criar usuário base no sistema');

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

			const doctorData = {
				userId: user.id,
				phone: parsedInput.phone,
				cpf: parsedInput.cpf,
				gender: parsedInput.gender,
				licenseNumber: parsedInput.licenseNumber,
				licenseState: parsedInput.licenseState,
				specialty: parsedInput.specialty,
				availableFromWeekDay: Number(parsedInput.availableFromWeekDay),
				availableToWeekDay: Number(parsedInput.availableToWeekDay),
				availableFromTime: parsedInput.availableFromTime,
				availableToTime: parsedInput.availableToTime,
			};

			if (existingDoctor) {
				await transaction
					.update(doctorsTable)
					.set({ ...doctorData, updatedAt: new Date() })
					.where(eq(doctorsTable.id, existingDoctor.id));
			} else {
				await transaction.insert(doctorsTable).values(doctorData);
			}
		});

		revalidatePath('/doctors');
	});

export const deleteDoctor = actionClient
	.schema(z.object({ id: z.uuid() }))
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireAdmin(context);

		const doctor = await db.query.doctorsTable.findFirst({
			where: eq(doctorsTable.id, parsedInput.id),
		});

		if (!doctor) throw new Error('Veterinário não encontrado');
		await db.delete(doctorsTable).where(eq(doctorsTable.id, parsedInput.id));

		revalidatePath('/doctors');
	});

export const getDoctorsForSelection = async (): Promise<DoctorOption[]> => {
	await requireAuthContext();

	const doctors = await db.query.doctorsTable.findMany({
		columns: {
			id: true,
		},
		with: {
			user: {
				columns: {
					name: true,
				},
			},
		},
		orderBy: (table, { asc }) => [asc(table.id)],
	});

	return doctors;
};

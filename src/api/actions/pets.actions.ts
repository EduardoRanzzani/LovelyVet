'use server';

import { db } from '@/db';
import {
	appointmentsTable,
	breedsTable,
	customersTable,
	medicalRecordsTable,
	petsTable,
	petTutorsTable,
	petWeightsTable,
	prescriptionsTable,
	speciesTable,
	usersTable,
} from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import type { AuthContext } from '@/lib/security/auth-context';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { buildPetAccessCondition } from '@/lib/security/pet-access';
import { filterPetForViewer } from '@/lib/security/pet-visibility';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import type { SQL } from 'drizzle-orm';
import {
	and,
	asc,
	countDistinct,
	desc,
	eq,
	gte,
	ilike,
	inArray,
	lte,
	or,
} from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import z from 'zod';
import { monthNames, PaginatedData } from '../config/consts';
import {
	createPetWithTutorAndBreedSchema,
	PetsWithRelations,
} from '../schema/pets.schema';
import { sendEmailAction } from './emails.actions';

const buildPetsListWhere = (
	context: AuthContext,
	search?: string,
): SQL | undefined => {
	const parts: SQL[] = [];
	const accessCondition = buildPetAccessCondition(context);

	if (accessCondition) {
		parts.push(accessCondition);
	}

	if (search?.trim()) {
		const s = `%${search.trim()}%`;

		parts.push(
			or(
				ilike(petsTable.name, s),
				ilike(petsTable.color, s),
				inArray(
					petsTable.breedId,
					db
						.select({ id: breedsTable.id })
						.from(breedsTable)
						.where(ilike(breedsTable.name, s)),
				),
				inArray(
					petsTable.breedId,
					db
						.select({ id: breedsTable.id })
						.from(breedsTable)
						.innerJoin(speciesTable, eq(breedsTable.specieId, speciesTable.id))
						.where(ilike(speciesTable.name, s)),
				),
				inArray(
					petsTable.id,
					db
						.select({ petId: petTutorsTable.petId })
						.from(petTutorsTable)
						.innerJoin(
							customersTable,
							eq(petTutorsTable.customerId, customersTable.id),
						)
						.innerJoin(usersTable, eq(customersTable.userId, usersTable.id))
						.where(ilike(usersTable.name, s)),
				),
			)!,
		);
	}

	return parts.length ? and(...parts) : undefined;
};

export const getCreatedPets = async (
	monthName?: string,
): Promise<PetsWithRelations[]> => {
	const context = await requireAuthContext();
	const accessCondition = buildPetAccessCondition(context);

	const now = new Date();
	const year = now.getFullYear();

	const monthIndex = monthName
		? monthNames.indexOf(monthName.toLowerCase())
		: now.getMonth();

	const safeMonthIndex = monthIndex === -1 ? now.getMonth() : monthIndex;

	const referenceDate = new Date(year, safeMonthIndex, 1);
	const startRange = startOfMonth(referenceDate);
	const endRange = endOfMonth(referenceDate);

	const pets = await db.query.petsTable.findMany({
		where: and(
			accessCondition,
			lte(petsTable.createdAt, endRange),
			gte(petsTable.createdAt, startRange),
		),
		with: {
			petTutors: {
				with: {
					tutor: {
						with: {
							user: true,
						},
					},
				},
			},
			breed: {
				with: {
					specie: true,
				},
			},
			weightHistory: {
				orderBy: (weights, { desc }) => [desc(weights.measuredAt)],
				limit: 1,
			},
		},
	});

	return pets as PetsWithRelations[];
};

export const getPetById = async (id: string): Promise<PetsWithRelations> => {
	const context = await requireAuthContext();

	const pet = await db.query.petsTable.findFirst({
		where: buildPetAccessCondition(context, id),
		with: {
			breed: { with: { specie: true } },
			petTutors: { with: { tutor: { with: { user: true } } } },
			medicalRecords: {
				orderBy: desc(medicalRecordsTable.createdAt),
				with: { doctor: { with: { user: true } } },
			},
			prescriptions: {
				orderBy: desc(prescriptionsTable.issuedAt),
				with: { doctor: { with: { user: true } } },
			},
			weightHistory: {
				orderBy: desc(petWeightsTable.measuredAt),
				with: { author: true },
			},
			appointments: {
				orderBy: desc(appointmentsTable.scheduledAt),
				with: {
					doctor: { with: { user: true } },
					items: { with: { service: true } },
				},
			},
			vaccines: {
				with: { doctor: { with: { user: true } } },
			},
			pathologies: {
				with: { doctor: { with: { user: true } } },
			},
			attachments: {
				with: { author: true },
			},
			notes: {
				with: { author: true },
			},
		},
	});

	if (!pet) {
		throw new Error('Pet não encontrado');
	}
	return filterPetForViewer(context, pet as unknown as PetsWithRelations);
};

export const getPets = async (): Promise<PetsWithRelations[]> => {
	const context = await requireAuthContext();
	const filter = buildPetsListWhere(context);

	const data = await db.query.petsTable.findMany({
		where: filter,
		with: {
			petTutors: { with: { tutor: { with: { user: true } } } },
			breed: { with: { specie: true } },
		},
		orderBy: asc(petsTable.name),
	});

	return data as PetsWithRelations[];
};

export const getPetsPaginated = async (
	page: number,
	limit: number,
	search?: string,
): Promise<PaginatedData<PetsWithRelations>> => {
	const context = await requireAuthContext();
	const filter = buildPetsListWhere(context, search);

	const offset = (page - 1) * limit;
	const data = await db.query.petsTable.findMany({
		where: filter,
		with: {
			petTutors: { with: { tutor: { with: { user: true } } } },
			breed: { with: { specie: true } },
			weightHistory: {
				orderBy: (w, { desc }) => [desc(w.measuredAt)],
				limit: 1,
			},
		},
		limit,
		offset,
		orderBy: asc(petsTable.name),
	});

	const totalCountResult = await db
		.select({ value: countDistinct(petsTable.id) })
		.from(petsTable)
		.where(filter);

	const totalCount = Number(totalCountResult[0]?.value ?? 0);

	return {
		data: data as PetsWithRelations[],
		metadata: {
			totalCount,
			pageCount: Math.ceil(totalCount / limit),
			currentPage: page,
			limit,
		},
	};
};

export const upsertPet = actionClient
	.schema(createPetWithTutorAndBreedSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireStaff(context);

		const isNewRegistration = !parsedInput.id;
		const tutorIds = [...new Set(parsedInput.customerIds)];

		const authorId = context.userId;

		const petResult = await db.transaction(async (tx) => {
			const [insertedPet] = await tx
				.insert(petsTable)
				.values({
					id: parsedInput.id ?? undefined,
					name: parsedInput.name,
					birthDate: format(parsedInput.birthDate, 'yyyy-MM-dd'),
					breedId: parsedInput.breedId,
					sterile: parsedInput.sterile ?? false,
					status: parsedInput.status ?? 'alive',
					photo: parsedInput.photo,
					color: parsedInput.color,
					gender: parsedInput.gender,
				})
				.onConflictDoUpdate({
					target: petsTable.id,
					set: {
						name: parsedInput.name,
						birthDate: format(parsedInput.birthDate, 'yyyy-MM-dd'),
						breedId: parsedInput.breedId,
						sterile: parsedInput.sterile ?? false,
						status: parsedInput.status ?? 'alive',
						photo: parsedInput.photo,
						color: parsedInput.color,
						gender: parsedInput.gender,
						updatedAt: new Date(),
					},
				})
				.returning();

			if (!insertedPet) throw new Error('Erro ao salvar o pet');

			await tx
				.delete(petTutorsTable)
				.where(eq(petTutorsTable.petId, insertedPet.id));

			if (tutorIds.length > 0) {
				await tx.insert(petTutorsTable).values(
					tutorIds.map((customerId) => ({
						petId: insertedPet.id,
						customerId,
					})),
				);
			}

			if (parsedInput.weightInGrams) {
				await tx.insert(petWeightsTable).values({
					petId: insertedPet.id,
					weightInGrams: Math.round(parsedInput.weightInGrams * 1000),
					authorId,
					measuredAt: new Date(),
				});
			}

			return insertedPet;
		});

		if (isNewRegistration) {
			const emailed = new Set<string>();
			for (const customerId of tutorIds) {
				const tutor = await db.query.customersTable.findFirst({
					where: eq(customersTable.id, customerId),
					with: {
						user: true,
					},
				});

				const email = tutor?.user?.email;
				if (email && !emailed.has(email)) {
					emailed.add(email);
					const firstName =
						tutor!.user!.name.split(/\s+/)[0] ?? tutor!.user!.name;
					await sendEmailAction({
						to: email,
						subject: 'Novo Pet Adicionado',
						body: `Olá, ${firstName}! <br/> O pet ${petResult.name} foi adicionado ao seu cadastro.`,
					});
				}
			}
		}

		revalidatePath('/pets');
		return petResult;
	});

export const deletePet = actionClient
	.schema(z.object({ id: z.uuid() }))
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireStaff(context);

		const pet = await db.query.petsTable.findFirst({
			where: eq(petsTable.id, parsedInput.id),
		});

		if (!pet) throw new Error('Pet não encontrado');

		await db.delete(petsTable).where(eq(petsTable.id, parsedInput.id));

		revalidatePath('/pets');
	});

export const getPetHistory = async (petId: string) => {
	const context = await requireAuthContext();

	const data = await db.query.petsTable.findFirst({
		where: buildPetAccessCondition(context, petId),
		with: {
			medicalRecords: {
				orderBy: desc(medicalRecordsTable.createdAt),
				with: { doctor: { with: { user: true } } },
			},
			prescriptions: {
				orderBy: desc(prescriptionsTable.issuedAt),
				with: { doctor: { with: { user: true } } },
			},
			weightHistory: {
				orderBy: desc(petWeightsTable.measuredAt),
				with: { author: true },
			},
			appointments: {
				orderBy: desc(appointmentsTable.scheduledAt),
				with: {
					doctor: { with: { user: true } },
					items: { with: { service: true } },
				},
			},
			vaccines: {
				with: { doctor: { with: { user: true } } },
			},
			pathologies: {
				with: { doctor: { with: { user: true } } },
			},
			attachments: {
				with: { author: true },
			},
			notes: {
				with: { author: true },
			},
			breed: {
				with: { specie: true },
			},
			petTutors: {
				with: { tutor: { with: { user: true } } },
			},
		},
	});
	return data;
};

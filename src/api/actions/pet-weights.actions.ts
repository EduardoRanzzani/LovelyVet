'use server';

import { db } from '@/db';
import { petWeightsTable, usersTable } from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { currentUser } from '@clerk/nextjs/server';
import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
	createPetWeightSchema,
	PetWeight,
	PetWeightWithRelations,
} from '../schema/pet-weight.schema';

export const getPetWeights = async (): Promise<PetWeightWithRelations[]> => {
	const authenticatedUser = await currentUser();
	if (!authenticatedUser) throw new Error('Usuário não autenticado');

	const weightHistory = await db.query.petWeightsTable.findMany({
		with: {
			pet: {
				with: {
					breed: {
						with: {
							specie: true,
						},
					},
					petTutors: {
						with: {
							tutor: {
								with: {
									user: true,
								},
							},
						},
					},
				},
			},
		},
	});

	return weightHistory as PetWeightWithRelations[];
};

export const getLastPetWeight = async (
	petId: string,
): Promise<PetWeight | null> => {
	const authenticatedUser = await currentUser();
	if (!authenticatedUser) throw new Error('Usuário não autenticado');

	const lastWeight = await db.query.petWeightsTable.findFirst({
		where: eq(petWeightsTable.petId, petId),
		orderBy: [desc(petWeightsTable.measuredAt)],
	});

	return lastWeight as PetWeight;
};

export const insertPetWeight = actionClient
	.schema(createPetWeightSchema)
	.action(async ({ parsedInput }) => {
		const authenticatedUser = await currentUser();
		if (!authenticatedUser) throw new Error('Usuário não autenticado');

		const user = await db.query.usersTable.findFirst({
			where: eq(usersTable.clerkUserId, authenticatedUser.id),
		});
		const authorId = user?.id;
		if (!authorId) {
			throw new Error(
				'Usuário autenticado não encontrado para registrar o peso',
			);
		}

		await db.insert(petWeightsTable).values({
			petId: parsedInput.petId!,
			weightInGrams: Math.round(parsedInput.weightInGrams * 1000),
			authorId,
			measuredAt: new Date(),
			createdAt: new Date(),
		});

		revalidatePath(`/pets/${parsedInput.petId}`);
	});

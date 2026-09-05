'use server';

import { db } from '@/db';
import { petWeightsTable } from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { assertCanAccessPet } from '@/lib/security/pet-access';
import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
	createPetWeightSchema,
	PetWeight,
	PetWeightWithRelations,
} from '../schema/pet-weight.schema';

export const getPetWeights = async (): Promise<PetWeightWithRelations[]> => {
	const context = await requireAuthContext();
	requireStaff(context);

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
	const context = await requireAuthContext();
	await assertCanAccessPet(context, petId);

	const lastWeight = await db.query.petWeightsTable.findFirst({
		where: eq(petWeightsTable.petId, petId),
		orderBy: [desc(petWeightsTable.measuredAt)],
	});

	return lastWeight as PetWeight;
};

export const insertPetWeight = actionClient
	.schema(createPetWeightSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		requireStaff(context);

		await db.insert(petWeightsTable).values({
			petId: parsedInput.petId!,
			weightInGrams: Math.round(parsedInput.weightInGrams * 1000),
			authorId: context.userId,
			measuredAt: new Date(),
			createdAt: new Date(),
		});

		revalidatePath(`/pets/${parsedInput.petId}`);
	});

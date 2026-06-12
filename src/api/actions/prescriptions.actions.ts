'use server';

import { db } from '@/db';
import { prescriptionItemsTable, prescriptionsTable } from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { currentUser } from '@clerk/nextjs/server';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { createPrescriptionSchema } from '../schema/prescriptions.schema';

/**
 * Monta o conteúdo HTML da receita a partir dos items selecionados
 */
const buildPrescriptionContent = (
	prescriptionItems: Array<{
		name: string;
		pharmacy: string;
		quantity: string;
		orientations: string;
	}>,
): string => {
	const items = prescriptionItems
		.map(
			(item) =>
				`<div class="prescription-item">
                <div class="item-header">
                    <span class="item-name"><strong>${item.name}</strong></span>
                    <span class="item-pharmacy">(${item.pharmacy})</span>
                    <span class="item-quantity"><strong>${item.quantity}</strong></span>
                </div>
                <div class="item-orientations">
                    ${item.orientations}
                </div>
            </div>`,
		)
		.join('');

	return `<div class="prescription-content">${items}</div>`;
};

export const createPrescription = actionClient
	.schema(createPrescriptionSchema)
	.action(async ({ parsedInput }) => {
		const authenticatedUser = await currentUser();
		if (!authenticatedUser) throw new Error('Nenhum usuário autenticado');

		// Buscar os items da receita selecionados
		const prescriptionItems = await db.query.prescriptionItemsTable.findMany({
			where: inArray(
				prescriptionItemsTable.id,
				parsedInput.prescriptionItemsIds,
			),
		});

		if (prescriptionItems.length === 0) {
			throw new Error('Nenhum item de receita encontrado');
		}

		// Usar conteúdo customizado ou gerar automaticamente
		const content =
			parsedInput.customContent || buildPrescriptionContent(prescriptionItems);

		// Criar a receita
		const result = await db.insert(prescriptionsTable).values({
			petId: parsedInput.petId,
			doctorId: parsedInput.doctorId,
			appointmentId: parsedInput.appointmentId || null,
			content: content,
			issuedAt: new Date(),
		});

		revalidatePath('/pets');

		return {
			success: true,
			message: 'Receita criada com sucesso!',
		};
	});

export const getPrescriptionsByPet = async (petId: string) => {
	const authenticatedUser = await currentUser();
	if (!authenticatedUser) throw new Error('Usuário não autenticado');

	return await db.query.prescriptionsTable.findMany({
		where: eq(prescriptionsTable.petId, petId),
		with: {
			doctor: {
				with: {
					user: true,
				},
			},
		},
		orderBy: (prescriptions, { desc }) => desc(prescriptions.issuedAt),
	});
};

export const getPrescriptionById = async (prescriptionId: string) => {
	const authenticatedUser = await currentUser();
	if (!authenticatedUser) throw new Error('Usuário não autenticado');

	return await db.query.prescriptionsTable.findFirst({
		where: eq(prescriptionsTable.id, prescriptionId),
		with: {
			doctor: {
				with: {
					user: true,
				},
			},
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
};

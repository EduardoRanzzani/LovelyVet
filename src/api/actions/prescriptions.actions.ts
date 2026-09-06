'use server';

import { db } from '@/db';
import {
	petWeightsTable,
	prescriptionItemsTable,
	prescriptionsTable,
} from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { resolveClinicalDoctorId } from '@/lib/security/clinical-access';
import { assertCanAccessPet } from '@/lib/security/pet-access';
import { asc, count, desc, eq, ilike, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { MAX_PAGE_SIZE, PaginatedData } from '../config/consts';
import {
	createPrescriptionSchema,
	PrescriptionsWithRelations,
} from '../schema/prescriptions.schema';
import { escapeHtml, sanitizeRichTextHtml } from '@/lib/security/html';

const buildPrescriptionContent = (
	prescriptionItems: Array<{
		id?: string;
		name: string;
		pharmacy: string;
		quantity: string;
		orientations: string;
	}>,
): string => {
	const items = prescriptionItems
		.map(
			(item) =>
				`<div style="display: flex; flex-direction: column; gap: 0px; margin-bottom: 12px;">
                    <div style="display: flex; align-items: baseline; width: 100%; gap: 4px; font-size: 15px;">
                        <span style="font-weight: bold; white-space: nowrap;">
                            ${escapeHtml(item.name)}
                        </span>

                        <div style="flex: 1; border-bottom: 1px solid #000; margin-bottom: 3px;"></div>

                        <span style="font-weight: bold; white-space: nowrap;">
                            (${escapeHtml(item.pharmacy)})
                        </span>

                        <div style="flex: 1; border-bottom: 1px solid #000; margin-bottom: 3px;"></div>

                        <span style="font-weight: bold; white-space: nowrap;">
                            ${escapeHtml(item.quantity)}
                        </span>
                    </div>

                    <div class="orientations-box" style="font-size: 13px; line-height: 1.3; margin-top: 2px;">
                        <style>
                            .orientations-box p { margin: 0 !important; padding: 0 !important; }
                        </style>
                        ${sanitizeRichTextHtml(item.orientations)}
                    </div>
                </div>`,
		)
		.join('');

	return `<div class="prescription-content" style="display: flex; flex-direction: column; gap: 4px;">${items}</div>`;
};

export const getPrescriptionsPaginated = async (
	page: number = 1,
	limit: number = MAX_PAGE_SIZE,
	search?: string,
): Promise<PaginatedData<PrescriptionsWithRelations>> => {
	const context = await requireAuthContext();
	requireStaff(context);

	const offset = (page - 1) * limit;

	const filterConditions = search
		? ilike(prescriptionsTable.content, `%${search}%`)
		: undefined;

	const data = await db.query.prescriptionsTable.findMany({
		where: filterConditions,
		with: { pet: true, doctor: true },
		limit: limit,
		offset: offset,
		orderBy: asc(prescriptionsTable.createdAt),
	});

	const totalCountResult = await db
		.select({ value: count() })
		.from(prescriptionsTable)
		.where(filterConditions);

	const totalCount = Number(totalCountResult[0]?.value ?? 0);
	const pageCount = Math.ceil(totalCount / limit);

	return {
		data: data as PrescriptionsWithRelations[],
		metadata: {
			totalCount,
			pageCount,
			currentPage: page,
			limit,
		},
	};
};

export const createPrescription = actionClient
	.schema(createPrescriptionSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		const doctorId = resolveClinicalDoctorId(context, parsedInput.doctorId);

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
		const content = parsedInput.customContent
			? sanitizeRichTextHtml(parsedInput.customContent)
			: buildPrescriptionContent(prescriptionItems);

		// Criar a receita
		await db.insert(prescriptionsTable).values({
			petId: parsedInput.petId,
			doctorId,
			appointmentId: parsedInput.appointmentId || null,
			content,
			issuedAt: new Date(),
		});

		revalidatePath('/pets');
		return {
			success: true,
			message: 'Receita criada com sucesso!',
		};
	});

export const getPrescriptionsByPet = async (petId: string) => {
	const context = await requireAuthContext();
	await assertCanAccessPet(context, petId);

	return await db.query.prescriptionsTable.findMany({
		where: eq(prescriptionsTable.petId, petId),
		with: { doctor: { with: { user: true } } },
		orderBy: (prescriptions, { desc }) => desc(prescriptions.issuedAt),
	});
};

export const getPrescriptionById = async (prescriptionId: string) => {
	const context = await requireAuthContext();

	const prescription = await db.query.prescriptionsTable.findFirst({
		columns: { id: true, petId: true },
		where: eq(prescriptionsTable.id, prescriptionId),
	});

	if (!prescription) {
		throw new Error('Prescrição não encontrada');
	}

	await assertCanAccessPet(context, prescription.petId);

	return await db.query.prescriptionsTable.findFirst({
		where: eq(prescriptionsTable.id, prescriptionId),
		with: {
			doctor: { with: { user: true } },
			pet: {
				with: {
					breed: { with: { specie: true } },
					petTutors: { with: { tutor: { with: { user: true } } } },
					weightHistory: {
						orderBy: desc(petWeightsTable.measuredAt),
						with: { author: true },
					},
				},
			},
		},
	});
};

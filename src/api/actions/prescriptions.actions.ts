'use server';

import { db } from '@/db';
import {
	petWeightsTable,
	prescriptionItemsTable,
	prescriptionsTable,
	breedsTable,
	customersTable,
	petsTable,
	petTutorsTable,
	speciesTable,
	usersTable,
} from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { resolveClinicalDoctorId } from '@/lib/security/clinical-access';
import { assertCanAccessPet } from '@/lib/security/pet-access';
import { asc, and, count, desc, eq, ilike, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { MAX_PAGE_SIZE, PaginatedData } from '../config/consts';
import {
	createPrescriptionSchema,
	PrescriptionsWithRelations,
} from '../schema/prescriptions.schema';
import { escapeHtml, sanitizeRichTextHtml } from '@/lib/security/html';
import { formatAgeShort } from '@/api/util';
import { formatWeight } from '@/helpers/weight';
import { savePrescriptionDocumentSchema } from '../schema/prescription-document.schema';

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

	const [prescription] = await db
		.select({
			id: prescriptionsTable.id,
			petId: prescriptionsTable.petId,
		})
		.from(prescriptionsTable)
		.where(eq(prescriptionsTable.id, prescriptionId))
		.limit(1);

	if (!prescription) {
		throw new Error('Prescrição não encontrada');
	}

	await assertCanAccessPet(context, prescription.petId);

	const data = await db.query.prescriptionsTable.findFirst({
		where: (prescriptions, { eq }) => eq(prescriptions.id, prescriptionId),
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

	if (!data) {
		throw new Error('Prescrição não encontrada');
	}

	if (context.role !== 'customer') {
		return data;
	}

	return {
		...data,
		pet: {
			...data.pet,
			petTutors: data.pet.petTutors.filter(
				({ tutor }) => tutor.id === context.customerId,
			),
		},
	};
};

export const savePrescriptionDocument = actionClient
	.schema(savePrescriptionDocumentSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();

		const doctorId = resolveClinicalDoctorId(context, parsedInput.doctorId);

		await assertCanAccessPet(context, parsedInput.petId);

		// Confirma que o tutor selecionado realmente pertence ao pet.
		const [tutor] = await db
			.select({
				id: customersTable.id,
				name: usersTable.name,
			})
			.from(petTutorsTable)
			.innerJoin(
				customersTable,
				eq(petTutorsTable.customerId, customersTable.id),
			)
			.innerJoin(usersTable, eq(customersTable.userId, usersTable.id))
			.where(
				and(
					eq(petTutorsTable.petId, parsedInput.petId),
					eq(petTutorsTable.customerId, parsedInput.tutorId),
				),
			)
			.limit(1);

		if (!tutor) {
			throw new Error('Tutor não pertence ao paciente');
		}

		// Dados atuais do paciente.
		const [pet] = await db
			.select({
				id: petsTable.id,
				name: petsTable.name,
				birthDate: petsTable.birthDate,
				gender: petsTable.gender,
				breed: breedsTable.name,
				species: speciesTable.name,
			})
			.from(petsTable)
			.innerJoin(breedsTable, eq(petsTable.breedId, breedsTable.id))
			.innerJoin(speciesTable, eq(breedsTable.specieId, speciesTable.id))
			.where(eq(petsTable.id, parsedInput.petId))
			.limit(1);

		if (!pet) {
			throw new Error('Paciente não encontrado');
		}

		const [latestWeight] = await db
			.select({
				weightInGrams: petWeightsTable.weightInGrams,
			})
			.from(petWeightsTable)
			.where(eq(petWeightsTable.petId, parsedInput.petId))
			.orderBy(desc(petWeightsTable.measuredAt))
			.limit(1);

		const items = parsedInput.items.map((item) => ({
			sourceId: item.sourceId,
			name: item.name,
			pharmacy: item.pharmacy,
			quantity: item.quantity,
			orientations: sanitizeRichTextHtml(item.orientations),
		}));

		const documentData = {
			tutor: {
				id: tutor.id,
				name: tutor.name,
			},

			patient: {
				name: pet.name,
				species: pet.species,
				breed: pet.breed,
				age: formatAgeShort(new Date(`${pet.birthDate}T12:00:00`)),
				weight: formatWeight(latestWeight?.weightInGrams ?? null),
				sex: pet.gender === 'male' ? 'M' : 'F',
			},

			administrationRoute: parsedInput.administrationRoute,

			items,
		};

		const content = buildPrescriptionContent(items);

		const [prescription] = await db
			.insert(prescriptionsTable)
			.values({
				petId: parsedInput.petId,
				doctorId,
				content,
				documentData,
				issuedAt: new Date(),
			})
			.returning({
				id: prescriptionsTable.id,
			});

		revalidatePath(`/pets/${parsedInput.petId}`);

		revalidatePath('/prescriptions');

		return {
			success: true,
			id: prescription.id,
			message: 'Receita salva com sucesso!',
		};
	});

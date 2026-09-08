'use server';

import { formatAgeShort } from '@/api/util';
import { db } from '@/db';
import {
	breedsTable,
	customersTable,
	petsTable,
	petTutorsTable,
	petWeightsTable,
	prescriptionItemsTable,
	prescriptionsTable,
	speciesTable,
	usersTable,
} from '@/db/schema';
import { formatWeight } from '@/helpers/weight';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { resolveClinicalDoctorId } from '@/lib/security/clinical-access';
import { escapeHtml, sanitizeRichTextHtml } from '@/lib/security/html';
import { assertCanAccessPet } from '@/lib/security/pet-access';
import { and, count, desc, eq, ilike, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { MAX_PAGE_SIZE, PaginatedData } from '../config/consts';
import {
	savePrescriptionDocumentSchema,
	updatePrescriptionDocumentSchema,
} from '../schema/prescription-document.schema';
import {
	createPrescriptionSchema,
	PrescriptionsWithRelations,
} from '../schema/prescriptions.schema';

/**
 * Mantido por compatibilidade com o fluxo antigo.
 *
 * Os novos documentos também usam esse HTML como representação
 * renderizável da receita, enquanto documentData mantém o snapshot
 * estruturado e editável.
 */
const buildPrescriptionContent = (
	prescriptionItems: Array<{
		id?: string;
		sourceId?: string | null;
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

					<div
						class="orientations-box"
						style="font-size: 13px; line-height: 1.3; margin-top: 2px;"
					>
						<style>
							.orientations-box p {
								margin: 0 !important;
								padding: 0 !important;
							}
						</style>

						${sanitizeRichTextHtml(item.orientations)}
					</div>
				</div>`,
		)
		.join('');

	return `<div class="prescription-content" style="display: flex; flex-direction: column; gap: 4px;">${items}</div>`;
};

/**
 * Lista administrativa de receitas.
 */
export const getPrescriptionsPaginated = async (
	page: number = 1,
	limit: number = MAX_PAGE_SIZE,
	search?: string,
): Promise<PaginatedData<PrescriptionsWithRelations>> => {
	const context = await requireAuthContext();

	requireStaff(context);

	const offset = (page - 1) * limit;
	const normalizedSearch = search?.trim();

	const data = await db.query.prescriptionsTable.findMany({
		where: normalizedSearch
			? (prescriptions, { ilike }) =>
					ilike(prescriptions.content, `%${normalizedSearch}%`)
			: undefined,

		with: {
			pet: true,
			doctor: true,
		},

		limit,
		offset,

		orderBy: (prescriptions, { asc }) => asc(prescriptions.createdAt),
	});

	const totalCountResult = await db
		.select({
			value: count(),
		})
		.from(prescriptionsTable)
		.where(
			normalizedSearch
				? ilike(prescriptionsTable.content, `%${normalizedSearch}%`)
				: undefined,
		);

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

/**
 * Fluxo legado de criação.
 *
 * Mantemos temporariamente porque componentes antigos ainda podem
 * depender dele. O novo builder usa savePrescriptionDocument().
 */
export const createPrescription = actionClient
	.schema(createPrescriptionSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();

		const doctorId = resolveClinicalDoctorId(context, parsedInput.doctorId);

		const prescriptionItems = await db.query.prescriptionItemsTable.findMany({
			where: inArray(
				prescriptionItemsTable.id,
				parsedInput.prescriptionItemsIds,
			),
		});

		if (prescriptionItems.length === 0) {
			throw new Error('Nenhum item de receita encontrado');
		}

		const content = parsedInput.customContent
			? sanitizeRichTextHtml(parsedInput.customContent)
			: buildPrescriptionContent(prescriptionItems);

		await db.insert(prescriptionsTable).values({
			petId: parsedInput.petId,
			doctorId,
			appointmentId: parsedInput.appointmentId ?? null,
			content,
			issuedAt: new Date(),
		});

		revalidatePath('/pets');

		return {
			success: true,
			message: 'Receita criada com sucesso!',
		};
	});

/**
 * Novo fluxo de criação pelo builder do paciente.
 *
 * O browser envia apenas identificadores e conteúdo clínico editável.
 * Os dados do paciente/tutor são conferidos e reconstruídos no servidor.
 */
export const savePrescriptionDocument = actionClient
	.schema(savePrescriptionDocumentSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();

		/*
		 * Também garante requireStaff().
		 *
		 * Doctor sempre será resolvido para o próprio doctorId.
		 * Admin pode informar o doctorId.
		 */
		const doctorId = resolveClinicalDoctorId(context, parsedInput.doctorId);
		await assertCanAccessPet(context, parsedInput.petId);

		/*
		 * Confirma que o tutor escolhido pertence
		 * realmente ao paciente.
		 */
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

		/*
		 * Busca dados reais do paciente no servidor.
		 */
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

		/*
		 * Sanitiza tudo antes de persistir.
		 */
		const items = parsedInput.items.map((item) => ({
			sourceId: item.sourceId,
			name: item.name.trim(),
			pharmacy: item.pharmacy.trim(),
			quantity: item.quantity.trim(),

			orientations: sanitizeRichTextHtml(item.orientations),
		}));

		/*
		 * Snapshot histórico.
		 *
		 * Estes valores não devem ser recalculados ao imprimir
		 * a receita daqui a meses/anos.
		 */
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

			administrationRoute: parsedInput.administrationRoute.trim(),

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

/**
 * Atualização da nova receita estruturada.
 *
 * Somente admin/doctor.
 */
export const updatePrescriptionDocument = actionClient
	.schema(updatePrescriptionDocumentSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();

		requireStaff(context);

		const [existingPrescription] = await db
			.select({
				id: prescriptionsTable.id,
				petId: prescriptionsTable.petId,
				documentData: prescriptionsTable.documentData,
			})
			.from(prescriptionsTable)
			.where(eq(prescriptionsTable.id, parsedInput.prescriptionId))
			.limit(1);

		if (!existingPrescription) {
			throw new Error('Receita não encontrada');
		}

		if (existingPrescription.petId !== parsedInput.petId) {
			throw new Error('Paciente inválido para esta receita');
		}

		if (!existingPrescription.documentData) {
			throw new Error('Esta receita antiga não possui dados editáveis');
		}

		await assertCanAccessPet(context, existingPrescription.petId);

		const doctorId = resolveClinicalDoctorId(context, parsedInput.doctorId);

		/*
		 * O tutor pode ser alterado durante a edição,
		 * mas precisa pertencer ao mesmo pet.
		 */
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

		const items = parsedInput.items.map((item) => ({
			sourceId: item.sourceId,
			name: item.name.trim(),
			pharmacy: item.pharmacy.trim(),
			quantity: item.quantity.trim(),
			orientations: sanitizeRichTextHtml(item.orientations),
		}));

		/*
		 * Mantemos o snapshot do paciente da emissão original.
		 *
		 * Peso e idade NÃO são recalculados ao editar.
		 */
		const documentData = {
			...existingPrescription.documentData,
			tutor: {
				id: tutor.id,
				name: tutor.name,
			},
			administrationRoute: parsedInput.administrationRoute.trim(),
			items,
			patient: existingPrescription.documentData.patient,
		};

		const content = buildPrescriptionContent(items);

		await db
			.update(prescriptionsTable)
			.set({
				doctorId,
				content,
				documentData,
				updatedAt: new Date(),
			})
			.where(eq(prescriptionsTable.id, parsedInput.prescriptionId));

		revalidatePath(`/pets/${parsedInput.petId}`);

		revalidatePath('/prescriptions');

		return {
			success: true,
			message: 'Receita atualizada com sucesso!',
		};
	});

/**
 * Receitas exibidas no histórico do pet.
 *
 * Customer só consegue consultar pets aos quais possui acesso.
 */
export const getPrescriptionsByPet = async (petId: string) => {
	const context = await requireAuthContext();

	await assertCanAccessPet(context, petId);

	return await db.query.prescriptionsTable.findMany({
		where: (prescriptions, { eq }) => eq(prescriptions.petId, petId),

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

/**
 * Leitura mínima usada pelo novo fluxo de edição/impressão.
 *
 * Admin/Doctor podem editar.
 * Customer pode ler quando possui acesso ao pet, para impressão.
 */
export const getPrescriptionDocumentById = async (prescriptionId: string) => {
	const context = await requireAuthContext();

	const [prescription] = await db
		.select({
			id: prescriptionsTable.id,
			petId: prescriptionsTable.petId,
			documentData: prescriptionsTable.documentData,
			issuedAt: prescriptionsTable.issuedAt,
			createdAt: prescriptionsTable.createdAt,
			updatedAt: prescriptionsTable.updatedAt,
		})
		.from(prescriptionsTable)
		.where(eq(prescriptionsTable.id, prescriptionId))
		.limit(1);

	if (!prescription) {
		return null;
	}

	await assertCanAccessPet(context, prescription.petId);

	return prescription;
};

/**
 * Leitura legada completa.
 *
 * Mantemos temporariamente enquanto componentes antigos de
 * prescriptions ainda dependem desse formato.
 */
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

	/*
	 * Customer não recebe dados dos outros tutores
	 * de um pet compartilhado.
	 */
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

'use server';

import { formatAgeShort } from '@/api/util';
import { db } from '@/db';
import {
	breedsTable,
	clinicalDocumentsTable,
	customersTable,
	petsTable,
	petTutorsTable,
	petWeightsTable,
	speciesTable,
	usersTable,
} from '@/db/schema';
import { formatWeight } from '@/helpers/weight';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { resolveClinicalDoctorId } from '@/lib/security/clinical-access';
import { sanitizeRichTextHtml } from '@/lib/security/html';
import { assertCanAccessPet } from '@/lib/security/pet-access';
import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { saveClinicalDocumentSchema } from '../schema/clinical-documents.schema';

const hasMeaningfulHtmlContent = (html: string): boolean => {
	const text = html
		.replace(/<[^>]*>/g, '')
		.replace(/&nbsp;/gi, ' ')
		.replace(/&#160;/gi, ' ')
		.trim();

	return text.length > 0;
};

export const saveClinicalDocument = actionClient
	.schema(saveClinicalDocumentSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();

		requireStaff(context);

		await assertCanAccessPet(context, parsedInput.petId);

		const doctorId = resolveClinicalDoctorId(context, parsedInput.doctorId);

		/*
		 * Confirma que o tutor escolhido
		 * pertence ao paciente.
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
		 * Dados atuais do paciente.
		 *
		 * Eles serão congelados no snapshot
		 * deste documento.
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

		const content = sanitizeRichTextHtml(parsedInput.content);

		if (!hasMeaningfulHtmlContent(content)) {
			throw new Error('Digite o conteúdo do documento');
		}

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
		};

		const [document] = await db
			.insert(clinicalDocumentsTable)
			.values({
				petId: parsedInput.petId,
				doctorId,
				type: parsedInput.type,
				content,
				documentData,
				issuedAt: new Date(),
			})
			.returning({
				id: clinicalDocumentsTable.id,
			});

		revalidatePath(`/pets/${parsedInput.petId}`);
		revalidatePath('/pets');

		return {
			success: true,
			id: document.id,
			message:
				parsedInput.type === 'referral'
					? 'Encaminhamento salvo com sucesso!'
					: 'Solicitação de exame salva com sucesso!',
		};
	});

export const getClinicalDocumentById = async (id: string) => {
	const context = await requireAuthContext();

	const [document] = await db
		.select({
			id: clinicalDocumentsTable.id,
			petId: clinicalDocumentsTable.petId,
			doctorId: clinicalDocumentsTable.doctorId,
			type: clinicalDocumentsTable.type,
			content: clinicalDocumentsTable.content,
			documentData: clinicalDocumentsTable.documentData,
			issuedAt: clinicalDocumentsTable.issuedAt,
			createdAt: clinicalDocumentsTable.createdAt,
			updatedAt: clinicalDocumentsTable.updatedAt,
		})
		.from(clinicalDocumentsTable)
		.where(eq(clinicalDocumentsTable.id, id))
		.limit(1);

	if (!document) {
		return null;
	}

	await assertCanAccessPet(context, document.petId);

	return document;
};

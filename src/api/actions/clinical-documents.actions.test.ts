import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clinicalDocumentsTable } from '@/db/schema';

const mocks = vi.hoisted(() => ({
	dbSelect: vi.fn(),
	dbInsert: vi.fn(),
	insertValues: vi.fn(),
	insertReturning: vi.fn(),
	requireAuthContext: vi.fn(),
	requireStaff: vi.fn(),
	resolveClinicalDoctorId: vi.fn(),
	assertCanAccessPet: vi.fn(),
	canAccessTutorScopedData: vi.fn(),
	sanitizeRichTextHtml: vi.fn(),
	formatAgeShort: vi.fn(),
	formatWeight: vi.fn(),
	revalidatePath: vi.fn(),
}));

vi.mock('@/db', () => ({
	db: {
		select: mocks.dbSelect,
		insert: mocks.dbInsert,
	},
}));

vi.mock('@/lib/next-safe-action', () => ({
	actionClient: {
		schema: () => ({
			action:
				(handler: (args: { parsedInput: unknown }) => unknown) =>
				(parsedInput: unknown) =>
					handler({ parsedInput }),
		}),
	},
}));

vi.mock('@/lib/security/auth-context', () => ({
	requireAuthContext: mocks.requireAuthContext,
}));

vi.mock('@/lib/security/authorization', () => ({
	requireStaff: mocks.requireStaff,
}));

vi.mock('@/lib/security/clinical-access', () => ({
	resolveClinicalDoctorId: mocks.resolveClinicalDoctorId,
}));

vi.mock('@/lib/security/pet-access', () => ({
	assertCanAccessPet: mocks.assertCanAccessPet,
}));

vi.mock('@/lib/security/customer-privacy', () => ({
	canAccessTutorScopedData: mocks.canAccessTutorScopedData,
}));

vi.mock('@/lib/security/html', () => ({
	sanitizeRichTextHtml: mocks.sanitizeRichTextHtml,
}));

vi.mock('@/api/util', () => ({
	formatAgeShort: mocks.formatAgeShort,
}));

vi.mock('@/helpers/weight', () => ({
	formatWeight: mocks.formatWeight,
}));

vi.mock('next/cache', () => ({
	revalidatePath: mocks.revalidatePath,
}));

import {
	getClinicalDocumentById,
	saveClinicalDocument,
} from './clinical-documents.actions';

const PET_ID = '11111111-1111-4111-8111-111111111111';
const TUTOR_ID = '22222222-2222-4222-8222-222222222222';
const DOCTOR_ID = '33333333-3333-4333-8333-333333333333';
const DOCUMENT_ID = '44444444-4444-4444-8444-444444444444';

const doctorContext = {
	clerkUserId: 'clerk-doctor',
	userId: 'user-doctor',
	role: 'doctor' as const,
	customerId: null,
	doctorId: DOCTOR_ID,
};

const customerContext = {
	clerkUserId: 'clerk-customer',
	userId: 'user-customer',
	role: 'customer' as const,
	customerId: TUTOR_ID,
	doctorId: null,
};

const baseInput = {
	petId: PET_ID,
	tutorId: TUTOR_ID,
	doctorId: DOCTOR_ID,
	type: 'referral' as const,
	content: '<p>Encaminhar paciente para avaliação cardiológica.</p>',
};

const tutor = {
	id: TUTOR_ID,
	name: 'Maria Silva',
};

const pet = {
	id: PET_ID,
	name: 'Thor',
	birthDate: '2022-01-10',
	gender: 'male',
	breed: 'Golden Retriever',
	species: 'Canino',
};

const document = {
	id: DOCUMENT_ID,
	petId: PET_ID,
	doctorId: DOCTOR_ID,
	type: 'referral' as const,
	content: '<p>Documento</p>',
	documentData: {
		tutor: {
			id: TUTOR_ID,
			name: 'Maria Silva',
		},
		patient: {
			name: 'Thor',
			species: 'Canino',
			breed: 'Golden Retriever',
			age: '4a',
			weight: '12,3 kg',
			sex: 'M',
		},
	},
	issuedAt: new Date('2026-09-28T12:00:00.000Z'),
	createdAt: new Date('2026-09-28T12:00:00.000Z'),
	updatedAt: new Date('2026-09-28T12:00:00.000Z'),
};

const createSelectChain = (rows: unknown[]) => {
	const chain = {
		from: vi.fn(),
		innerJoin: vi.fn(),
		where: vi.fn(),
		orderBy: vi.fn(),
		limit: vi.fn(),
	};

	chain.from.mockReturnValue(chain);
	chain.innerJoin.mockReturnValue(chain);
	chain.where.mockReturnValue(chain);
	chain.orderBy.mockReturnValue(chain);
	chain.limit.mockResolvedValue(rows);

	return chain;
};

const mockSaveLookups = ({
	tutorRows = [tutor],
	petRows = [pet],
	weightRows = [{ weightInGrams: 12300 }],
}: {
	tutorRows?: unknown[];
	petRows?: unknown[];
	weightRows?: unknown[];
} = {}) => {
	mocks.dbSelect
		.mockReturnValueOnce(createSelectChain(tutorRows))
		.mockReturnValueOnce(createSelectChain(petRows))
		.mockReturnValueOnce(createSelectChain(weightRows));
};

describe('clinical documents actions', () => {
	beforeEach(() => {
		vi.resetAllMocks();

		mocks.requireAuthContext.mockResolvedValue(doctorContext);
		mocks.requireStaff.mockReturnValue(undefined);
		mocks.resolveClinicalDoctorId.mockReturnValue(DOCTOR_ID);
		mocks.assertCanAccessPet.mockResolvedValue(undefined);
		mocks.canAccessTutorScopedData.mockReturnValue(true);
		mocks.sanitizeRichTextHtml.mockImplementation((html: string) => html);
		mocks.formatAgeShort.mockReturnValue('4a');
		mocks.formatWeight.mockReturnValue('12,3 kg');

		mocks.insertReturning.mockResolvedValue([
			{
				id: DOCUMENT_ID,
			},
		]);

		mocks.insertValues.mockReturnValue({
			returning: mocks.insertReturning,
		});

		mocks.dbInsert.mockReturnValue({
			values: mocks.insertValues,
		});
	});

	describe('saveClinicalDocument', () => {
		it('saves referral with patient and tutor snapshot', async () => {
			mockSaveLookups();

			const result = await saveClinicalDocument(baseInput);

			expect(mocks.requireStaff).toHaveBeenCalledWith(doctorContext);
			expect(mocks.assertCanAccessPet).toHaveBeenCalledWith(
				doctorContext,
				PET_ID,
			);
			expect(mocks.resolveClinicalDoctorId).toHaveBeenCalledWith(
				doctorContext,
				DOCTOR_ID,
			);
			expect(mocks.dbInsert).toHaveBeenCalledWith(clinicalDocumentsTable);
			expect(mocks.insertValues).toHaveBeenCalledWith(
				expect.objectContaining({
					petId: PET_ID,
					doctorId: DOCTOR_ID,
					type: 'referral',
					content: '<p>Encaminhar paciente para avaliação cardiológica.</p>',
					documentData: {
						tutor: {
							id: TUTOR_ID,
							name: 'Maria Silva',
						},
						patient: {
							name: 'Thor',
							species: 'Canino',
							breed: 'Golden Retriever',
							age: '4a',
							weight: '12,3 kg',
							sex: 'M',
						},
					},
					issuedAt: expect.any(Date),
				}),
			);
			expect(result).toEqual({
				success: true,
				id: DOCUMENT_ID,
				message: 'Encaminhamento salvo com sucesso!',
			});
			expect(mocks.revalidatePath).toHaveBeenCalledWith(`/pets/${PET_ID}`);
			expect(mocks.revalidatePath).toHaveBeenCalledWith('/pets');
		});

		it('saves exam request with correct message', async () => {
			mockSaveLookups();

			const result = await saveClinicalDocument({
				...baseInput,
				type: 'exam_request',
			});

			expect(mocks.insertValues).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'exam_request',
				}),
			);
			expect(result).toEqual({
				success: true,
				id: DOCUMENT_ID,
				message: 'Solicitação de exame salva com sucesso!',
			});
		});

		it('uses sanitized content when saving document', async () => {
			mockSaveLookups();

			mocks.sanitizeRichTextHtml.mockReturnValue('<p>Conteúdo seguro</p>');

			await saveClinicalDocument({
				...baseInput,
				content: '<p>Conteúdo seguro</p><script>alert("xss")</script>',
			});

			expect(mocks.sanitizeRichTextHtml).toHaveBeenCalledWith(
				'<p>Conteúdo seguro</p><script>alert("xss")</script>',
			);
			expect(mocks.insertValues).toHaveBeenCalledWith(
				expect.objectContaining({
					content: '<p>Conteúdo seguro</p>',
				}),
			);
		});

		it('rejects document with no meaningful content after sanitization', async () => {
			mockSaveLookups();

			mocks.sanitizeRichTextHtml.mockReturnValue('<p>&nbsp;</p>');

			await expect(saveClinicalDocument(baseInput)).rejects.toThrow(
				'Digite o conteúdo do documento',
			);

			expect(mocks.dbInsert).not.toHaveBeenCalled();
		});

		it('rejects tutor that does not belong to pet', async () => {
			mockSaveLookups({
				tutorRows: [],
			});

			await expect(saveClinicalDocument(baseInput)).rejects.toThrow(
				'Tutor não pertence ao paciente',
			);

			expect(mocks.dbInsert).not.toHaveBeenCalled();
		});

		it('rejects when patient is not found', async () => {
			mockSaveLookups({
				petRows: [],
			});

			await expect(saveClinicalDocument(baseInput)).rejects.toThrow(
				'Paciente não encontrado',
			);

			expect(mocks.dbInsert).not.toHaveBeenCalled();
		});

		it('creates snapshot without weight when patient has no weight', async () => {
			mockSaveLookups({
				weightRows: [],
			});

			mocks.formatWeight.mockReturnValue('-');

			await saveClinicalDocument(baseInput);

			expect(mocks.formatWeight).toHaveBeenCalledWith(null);
			expect(mocks.insertValues).toHaveBeenCalledWith(
				expect.objectContaining({
					documentData: expect.objectContaining({
						patient: expect.objectContaining({
							weight: '-',
						}),
					}),
				}),
			);
		});

		it('creates female patient snapshot with F sex', async () => {
			mockSaveLookups({
				petRows: [
					{
						...pet,
						gender: 'female',
					},
				],
			});

			await saveClinicalDocument(baseInput);

			expect(mocks.insertValues).toHaveBeenCalledWith(
				expect.objectContaining({
					documentData: expect.objectContaining({
						patient: expect.objectContaining({
							sex: 'F',
						}),
					}),
				}),
			);
		});

		it('stops before database queries when user is not staff', async () => {
			mocks.requireStaff.mockImplementation(() => {
				throw new Error('Usuário não autorizado');
			});

			await expect(saveClinicalDocument(baseInput)).rejects.toThrow(
				'Usuário não autorizado',
			);

			expect(mocks.assertCanAccessPet).not.toHaveBeenCalled();
			expect(mocks.dbSelect).not.toHaveBeenCalled();
			expect(mocks.dbInsert).not.toHaveBeenCalled();
		});

		it('stops when staff cannot access pet', async () => {
			mocks.assertCanAccessPet.mockRejectedValue(
				new Error('Paciente não encontrado'),
			);

			await expect(saveClinicalDocument(baseInput)).rejects.toThrow(
				'Paciente não encontrado',
			);

			expect(mocks.resolveClinicalDoctorId).not.toHaveBeenCalled();
			expect(mocks.dbSelect).not.toHaveBeenCalled();
			expect(mocks.dbInsert).not.toHaveBeenCalled();
		});
	});

	describe('getClinicalDocumentById', () => {
		it('returns accessible document', async () => {
			mocks.requireAuthContext.mockResolvedValue(customerContext);
			mocks.dbSelect.mockReturnValue(createSelectChain([document]));

			const result = await getClinicalDocumentById(DOCUMENT_ID);

			expect(mocks.assertCanAccessPet).toHaveBeenCalledWith(
				customerContext,
				PET_ID,
			);
			expect(mocks.canAccessTutorScopedData).toHaveBeenCalledWith(
				customerContext,
				TUTOR_ID,
			);
			expect(result).toEqual(document);
		});

		it('returns null when document does not exist', async () => {
			mocks.dbSelect.mockReturnValue(createSelectChain([]));

			const result = await getClinicalDocumentById(DOCUMENT_ID);

			expect(result).toBeNull();
			expect(mocks.assertCanAccessPet).not.toHaveBeenCalled();
			expect(mocks.canAccessTutorScopedData).not.toHaveBeenCalled();
		});

		it('returns null when customer cannot access tutor scoped document', async () => {
			mocks.requireAuthContext.mockResolvedValue(customerContext);
			mocks.canAccessTutorScopedData.mockReturnValue(false);
			mocks.dbSelect.mockReturnValue(createSelectChain([document]));

			const result = await getClinicalDocumentById(DOCUMENT_ID);

			expect(mocks.assertCanAccessPet).toHaveBeenCalledWith(
				customerContext,
				PET_ID,
			);
			expect(mocks.canAccessTutorScopedData).toHaveBeenCalledWith(
				customerContext,
				TUTOR_ID,
			);
			expect(result).toBeNull();
		});

		it('rejects access when user cannot access pet', async () => {
			mocks.dbSelect.mockReturnValue(createSelectChain([document]));
			mocks.assertCanAccessPet.mockRejectedValue(
				new Error('Paciente não encontrado'),
			);

			await expect(getClinicalDocumentById(DOCUMENT_ID)).rejects.toThrow(
				'Paciente não encontrado',
			);

			expect(mocks.canAccessTutorScopedData).not.toHaveBeenCalled();
		});
	});
});

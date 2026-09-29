import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	prescriptionItemsFindMany: vi.fn(),
	prescriptionsFindMany: vi.fn(),
	prescriptionsFindFirst: vi.fn(),
	dbSelect: vi.fn(),
	dbInsert: vi.fn(),
	insertValues: vi.fn(),
	insertReturning: vi.fn(),
	dbUpdate: vi.fn(),
	updateSet: vi.fn(),
	updateWhere: vi.fn(),
	requireAuthContext: vi.fn(),
	requireStaff: vi.fn(),
	resolveClinicalDoctorId: vi.fn(),
	assertCanAccessPet: vi.fn(),
	requireAccessibleAppointment: vi.fn(),
	canAccessTutorScopedData: vi.fn(),
	sanitizeDoctorForCustomer: vi.fn(),
	sanitizeTutorForCustomer: vi.fn(),
	sanitizeUserForCustomer: vi.fn(),
	sanitizeRichTextHtml: vi.fn(),
	escapeHtml: vi.fn(),
	normalizePagination: vi.fn(),
	assertPrescriptionIsUnsigned: vi.fn(),
	formatAgeShort: vi.fn(),
	formatWeight: vi.fn(),
	revalidatePath: vi.fn(),
}));

vi.mock('@/db', () => ({
	db: {
		query: {
			prescriptionItemsTable: {
				findMany: mocks.prescriptionItemsFindMany,
			},
			prescriptionsTable: {
				findMany: mocks.prescriptionsFindMany,
				findFirst: mocks.prescriptionsFindFirst,
			},
		},
		select: mocks.dbSelect,
		insert: mocks.dbInsert,
		update: mocks.dbUpdate,
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
	sanitizeDoctorForCustomer: mocks.sanitizeDoctorForCustomer,
	sanitizeTutorForCustomer: mocks.sanitizeTutorForCustomer,
	sanitizeUserForCustomer: mocks.sanitizeUserForCustomer,
}));

vi.mock('@/lib/security/html', () => ({
	sanitizeRichTextHtml: mocks.sanitizeRichTextHtml,
	escapeHtml: mocks.escapeHtml,
}));

vi.mock('@/lib/pagination', () => ({
	normalizePagination: mocks.normalizePagination,
}));

vi.mock('@/lib/prescriptions/prescription-signature', () => ({
	assertPrescriptionIsUnsigned: mocks.assertPrescriptionIsUnsigned,
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
	getPrescriptionById,
	getPrescriptionDocumentById,
	getPrescriptionsByPet,
	getPrescriptionsPaginated,
	savePrescriptionDocument,
	updatePrescriptionDocument,
} from './prescriptions.actions';

const PET_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_PET_ID = '22222222-2222-4222-8222-222222222222';
const TUTOR_ID = '33333333-3333-4333-8333-333333333333';
const OTHER_TUTOR_ID = '44444444-4444-4444-8444-444444444444';
const DOCTOR_ID = '55555555-5555-4555-8555-555555555555';
const PRESCRIPTION_ID = '66666666-6666-4666-8666-666666666666';

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

const documentInput = {
	petId: PET_ID,
	tutorId: TUTOR_ID,
	doctorId: DOCTOR_ID,
	isControlled: false,
	groups: [
		{
			administrationRoute: ' USO ORAL ',
			items: [
				{
					sourceId: null,
					name: ' Dipirona ',
					pharmacy: ' Veterinária ',
					quantity: ' 1 caixa ',
					orientations: '<p>Dar a cada 8 horas</p>',
				},
			],
		},
	],
};

const patientSnapshot = {
	name: 'Thor',
	species: 'Canino',
	breed: 'Golden Retriever',
	age: '4a',
	weight: '12,3 kg',
	sex: 'M',
};

const createLimitChain = (rows: unknown[]) => {
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

const createWhereChain = (rows: unknown[]) => {
	const chain = {
		from: vi.fn(),
		where: vi.fn(),
	};

	chain.from.mockReturnValue(chain);
	chain.where.mockResolvedValue(rows);

	return chain;
};

const mockDocumentLookups = () => {
	mocks.dbSelect
		.mockReturnValueOnce(
			createLimitChain([
				{
					id: TUTOR_ID,
					name: 'Maria Silva',
				},
			]),
		)
		.mockReturnValueOnce(
			createLimitChain([
				{
					id: PET_ID,
					name: 'Thor',
					birthDate: '2022-01-10',
					gender: 'male',
					breed: 'Golden Retriever',
					species: 'Canino',
				},
			]),
		)
		.mockReturnValueOnce(
			createLimitChain([
				{
					weightInGrams: 12300,
				},
			]),
		);
};

describe('prescriptions actions', () => {
	beforeEach(() => {
		vi.resetAllMocks();

		mocks.requireAuthContext.mockResolvedValue(doctorContext);
		mocks.requireStaff.mockReturnValue(undefined);
		mocks.resolveClinicalDoctorId.mockReturnValue(DOCTOR_ID);
		mocks.assertCanAccessPet.mockResolvedValue(undefined);
		mocks.canAccessTutorScopedData.mockReturnValue(true);
		mocks.sanitizeDoctorForCustomer.mockImplementation((doctor) => doctor);
		mocks.sanitizeTutorForCustomer.mockImplementation((tutor) => tutor);
		mocks.sanitizeUserForCustomer.mockImplementation((user) => user);
		mocks.sanitizeRichTextHtml.mockImplementation((content) => content);
		mocks.escapeHtml.mockImplementation((content) => content);
		mocks.normalizePagination.mockReturnValue({
			page: 1,
			limit: 10,
			offset: 0,
		});
		mocks.assertPrescriptionIsUnsigned.mockResolvedValue(undefined);
		mocks.formatAgeShort.mockReturnValue('4a');
		mocks.formatWeight.mockReturnValue('12,3 kg');

		mocks.insertReturning.mockResolvedValue([
			{
				id: PRESCRIPTION_ID,
			},
		]);
		mocks.insertValues.mockReturnValue({
			returning: mocks.insertReturning,
		});
		mocks.dbInsert.mockReturnValue({
			values: mocks.insertValues,
		});

		mocks.updateWhere.mockResolvedValue(undefined);
		mocks.updateSet.mockReturnValue({
			where: mocks.updateWhere,
		});
		mocks.dbUpdate.mockReturnValue({
			set: mocks.updateSet,
		});
	});

	describe('savePrescriptionDocument', () => {
		it('saves structured prescription with historical snapshot', async () => {
			mockDocumentLookups();
			mocks.sanitizeRichTextHtml.mockReturnValue('<p>Orientação segura</p>');

			const result = await savePrescriptionDocument(documentInput);

			expect(mocks.assertCanAccessPet).toHaveBeenCalledWith(
				doctorContext,
				PET_ID,
			);
			expect(mocks.insertValues).toHaveBeenCalledWith(
				expect.objectContaining({
					petId: PET_ID,
					doctorId: DOCTOR_ID,
					documentData: {
						tutor: {
							id: TUTOR_ID,
							name: 'Maria Silva',
						},
						patient: patientSnapshot,
						isControlled: false,
						groups: [
							{
								administrationRoute: 'USO ORAL',
								items: [
									{
										sourceId: null,
										name: 'Dipirona',
										pharmacy: 'Veterinária',
										quantity: '1 caixa',
										orientations: '<p>Orientação segura</p>',
									},
								],
							},
						],
					},
					issuedAt: expect.any(Date),
				}),
			);
			expect(result).toEqual({
				success: true,
				id: PRESCRIPTION_ID,
				message: 'Receita salva com sucesso!',
			});
			expect(mocks.revalidatePath).toHaveBeenCalledWith(`/pets/${PET_ID}`);
			expect(mocks.revalidatePath).toHaveBeenCalledWith('/prescriptions');
		});

		it('rejects tutor that does not belong to pet', async () => {
			mocks.dbSelect.mockReturnValueOnce(createLimitChain([]));

			await expect(savePrescriptionDocument(documentInput)).rejects.toThrow(
				'Tutor não pertence ao paciente',
			);

			expect(mocks.dbInsert).not.toHaveBeenCalled();
		});

		it('rejects when patient is not found', async () => {
			mocks.dbSelect
				.mockReturnValueOnce(
					createLimitChain([
						{
							id: TUTOR_ID,
							name: 'Maria Silva',
						},
					]),
				)
				.mockReturnValueOnce(createLimitChain([]));

			await expect(savePrescriptionDocument(documentInput)).rejects.toThrow(
				'Paciente não encontrado',
			);

			expect(mocks.dbInsert).not.toHaveBeenCalled();
		});

		it('sanitizes medication orientations', async () => {
			mockDocumentLookups();
			mocks.sanitizeRichTextHtml.mockReturnValue('<p>Seguro</p>');

			await savePrescriptionDocument(documentInput);

			expect(mocks.sanitizeRichTextHtml).toHaveBeenCalledWith(
				'<p>Dar a cada 8 horas</p>',
			);
			expect(mocks.insertValues).toHaveBeenCalledWith(
				expect.objectContaining({
					documentData: expect.objectContaining({
						groups: [
							expect.objectContaining({
								items: [
									expect.objectContaining({
										orientations: '<p>Seguro</p>',
									}),
								],
							}),
						],
					}),
				}),
			);
		});
	});

	describe('updatePrescriptionDocument', () => {
		const updateInput = {
			...documentInput,
			prescriptionId: PRESCRIPTION_ID,
			isControlled: true,
		};

		const existingPrescription = {
			id: PRESCRIPTION_ID,
			petId: PET_ID,
			documentData: {
				tutor: {
					id: TUTOR_ID,
					name: 'Maria Silva',
				},
				patient: patientSnapshot,
				isControlled: false,
				groups: [],
			},
		};

		it('updates unsigned prescription preserving patient snapshot', async () => {
			mocks.dbSelect
				.mockReturnValueOnce(createLimitChain([existingPrescription]))
				.mockReturnValueOnce(
					createLimitChain([
						{
							id: TUTOR_ID,
							name: 'Maria Silva',
						},
					]),
				);

			mocks.sanitizeRichTextHtml.mockReturnValue('<p>Atualizada</p>');

			const result = await updatePrescriptionDocument(updateInput);

			expect(mocks.assertPrescriptionIsUnsigned).toHaveBeenCalledWith(
				PRESCRIPTION_ID,
			);
			expect(mocks.assertCanAccessPet).toHaveBeenCalledWith(
				doctorContext,
				PET_ID,
			);
			expect(mocks.updateSet).toHaveBeenCalledWith(
				expect.objectContaining({
					doctorId: DOCTOR_ID,
					documentData: {
						tutor: {
							id: TUTOR_ID,
							name: 'Maria Silva',
						},
						patient: patientSnapshot,
						isControlled: true,
						groups: [
							{
								administrationRoute: 'USO ORAL',
								items: [
									{
										sourceId: null,
										name: 'Dipirona',
										pharmacy: 'Veterinária',
										quantity: '1 caixa',
										orientations: '<p>Atualizada</p>',
									},
								],
							},
						],
					},
					updatedAt: expect.any(Date),
				}),
			);
			expect(result).toEqual({
				success: true,
				message: 'Receita atualizada com sucesso!',
			});
		});

		it('rejects missing prescription', async () => {
			mocks.dbSelect.mockReturnValueOnce(createLimitChain([]));

			await expect(updatePrescriptionDocument(updateInput)).rejects.toThrow(
				'Receita não encontrada',
			);

			expect(mocks.assertPrescriptionIsUnsigned).not.toHaveBeenCalled();
			expect(mocks.dbUpdate).not.toHaveBeenCalled();
		});

		it('does not update signed prescription', async () => {
			mocks.dbSelect.mockReturnValueOnce(
				createLimitChain([existingPrescription]),
			);
			mocks.assertPrescriptionIsUnsigned.mockRejectedValue(
				new Error('Receita assinada não pode ser alterada'),
			);

			await expect(updatePrescriptionDocument(updateInput)).rejects.toThrow(
				'Receita assinada não pode ser alterada',
			);

			expect(mocks.dbUpdate).not.toHaveBeenCalled();
		});

		it('rejects different pet', async () => {
			mocks.dbSelect.mockReturnValueOnce(
				createLimitChain([
					{
						...existingPrescription,
						petId: OTHER_PET_ID,
					},
				]),
			);

			await expect(updatePrescriptionDocument(updateInput)).rejects.toThrow(
				'Paciente inválido para esta receita',
			);

			expect(mocks.dbUpdate).not.toHaveBeenCalled();
		});

		it('rejects legacy prescription without editable data', async () => {
			mocks.dbSelect.mockReturnValueOnce(
				createLimitChain([
					{
						...existingPrescription,
						documentData: null,
					},
				]),
			);

			await expect(updatePrescriptionDocument(updateInput)).rejects.toThrow(
				'Esta receita antiga não possui dados editáveis',
			);

			expect(mocks.dbUpdate).not.toHaveBeenCalled();
		});

		it('rejects tutor that does not belong to pet', async () => {
			mocks.dbSelect
				.mockReturnValueOnce(createLimitChain([existingPrescription]))
				.mockReturnValueOnce(createLimitChain([]));

			await expect(updatePrescriptionDocument(updateInput)).rejects.toThrow(
				'Tutor não pertence ao paciente',
			);

			expect(mocks.dbUpdate).not.toHaveBeenCalled();
		});
	});

	describe('getPrescriptionsPaginated', () => {
		it('returns normalized paginated data for staff', async () => {
			mocks.normalizePagination.mockReturnValue({
				page: 2,
				limit: 5,
				offset: 5,
			});
			mocks.prescriptionsFindMany.mockResolvedValue([
				{
					id: PRESCRIPTION_ID,
				},
			]);
			mocks.dbSelect.mockReturnValueOnce(
				createWhereChain([
					{
						value: 12,
					},
				]),
			);

			const result = await getPrescriptionsPaginated(2, 5, ' Thor ');

			expect(mocks.requireStaff).toHaveBeenCalledWith(doctorContext);
			expect(mocks.normalizePagination).toHaveBeenCalledWith(2, 5);
			expect(result.metadata).toEqual({
				totalCount: 12,
				pageCount: 3,
				currentPage: 2,
				limit: 5,
			});
			expect(result.data).toHaveLength(1);
		});
	});

	describe('getPrescriptionsByPet', () => {
		it('returns all prescriptions for staff', async () => {
			const prescriptions = [
				{
					id: PRESCRIPTION_ID,
					documentData: {
						tutor: {
							id: TUTOR_ID,
						},
					},
					doctor: {},
				},
			];

			mocks.prescriptionsFindMany.mockResolvedValue(prescriptions);

			const result = await getPrescriptionsByPet(PET_ID);

			expect(mocks.assertCanAccessPet).toHaveBeenCalledWith(
				doctorContext,
				PET_ID,
			);
			expect(result).toEqual(prescriptions);
			expect(mocks.sanitizeDoctorForCustomer).not.toHaveBeenCalled();
		});

		it('filters prescriptions from other tutors for customer', async () => {
			mocks.requireAuthContext.mockResolvedValue(customerContext);

			mocks.canAccessTutorScopedData.mockImplementation(
				(_context, tutorId) => !tutorId || tutorId === TUTOR_ID,
			);

			mocks.prescriptionsFindMany.mockResolvedValue([
				{
					id: 'own',
					documentData: {
						tutor: {
							id: TUTOR_ID,
						},
					},
					doctor: {
						id: DOCTOR_ID,
					},
				},
				{
					id: 'other',
					documentData: {
						tutor: {
							id: OTHER_TUTOR_ID,
						},
					},
					doctor: {
						id: DOCTOR_ID,
					},
				},
				{
					id: 'legacy',
					documentData: null,
					doctor: {
						id: DOCTOR_ID,
					},
				},
			]);

			const result = await getPrescriptionsByPet(PET_ID);

			expect(result.map((item) => item.id)).toEqual(['own', 'legacy']);
			expect(mocks.sanitizeDoctorForCustomer).toHaveBeenCalledTimes(2);
		});
	});

	describe('getPrescriptionDocumentById', () => {
		const prescription = {
			id: PRESCRIPTION_ID,
			petId: PET_ID,
			documentData: {
				tutor: {
					id: TUTOR_ID,
					name: 'Maria Silva',
				},
				patient: patientSnapshot,
			},
			signature: null,
		};

		it('returns accessible prescription document', async () => {
			mocks.requireAuthContext.mockResolvedValue(customerContext);
			mocks.prescriptionsFindFirst.mockResolvedValue(prescription);

			const result = await getPrescriptionDocumentById(PRESCRIPTION_ID);

			expect(mocks.assertCanAccessPet).toHaveBeenCalledWith(
				customerContext,
				PET_ID,
			);
			expect(mocks.canAccessTutorScopedData).toHaveBeenCalledWith(
				customerContext,
				TUTOR_ID,
			);
			expect(result).toEqual(prescription);
		});

		it('returns null when prescription does not exist', async () => {
			mocks.prescriptionsFindFirst.mockResolvedValue(null);

			const result = await getPrescriptionDocumentById(PRESCRIPTION_ID);

			expect(result).toBeNull();
			expect(mocks.assertCanAccessPet).not.toHaveBeenCalled();
		});

		it('returns null when customer cannot access tutor data', async () => {
			mocks.requireAuthContext.mockResolvedValue(customerContext);
			mocks.prescriptionsFindFirst.mockResolvedValue({
				...prescription,
				documentData: {
					...prescription.documentData,
					tutor: {
						id: OTHER_TUTOR_ID,
						name: 'Outro Tutor',
					},
				},
			});
			mocks.canAccessTutorScopedData.mockReturnValue(false);

			const result = await getPrescriptionDocumentById(PRESCRIPTION_ID);

			expect(result).toBeNull();
		});
	});

	describe('getPrescriptionById', () => {
		const doctor = {
			id: DOCTOR_ID,
			phone: '11999999999',
			cpf: '00000000000',
			user: {
				id: 'doctor-user',
				email: 'doctor@test.com',
			},
		};

		const ownTutor = {
			id: TUTOR_ID,
			phone: '11999999999',
			cpf: '00000000000',
			postalCode: '00000000',
			address: 'Rua A',
			addressNumber: '1',
			neighborhood: 'Centro',
			city: 'Cidade',
			state: 'SP',
			user: {
				id: 'tutor-user',
				email: 'tutor@test.com',
			},
		};

		const otherTutor = {
			...ownTutor,
			id: OTHER_TUTOR_ID,
		};

		const prescriptionData = {
			id: PRESCRIPTION_ID,
			petId: PET_ID,
			documentData: {
				tutor: {
					id: TUTOR_ID,
					name: 'Maria Silva',
				},
			},
			doctor,
			pet: {
				id: PET_ID,
				petTutors: [
					{
						tutor: ownTutor,
					},
					{
						tutor: otherTutor,
					},
				],
				weightHistory: [
					{
						id: 'weight-id',
						author: {
							id: 'author-id',
							email: 'author@test.com',
						},
					},
				],
			},
		};

		it('returns complete prescription for staff', async () => {
			mocks.dbSelect.mockReturnValueOnce(
				createLimitChain([
					{
						id: PRESCRIPTION_ID,
						petId: PET_ID,
					},
				]),
			);
			mocks.prescriptionsFindFirst.mockResolvedValue(prescriptionData);

			const result = await getPrescriptionById(PRESCRIPTION_ID);

			expect(mocks.assertCanAccessPet).toHaveBeenCalledWith(
				doctorContext,
				PET_ID,
			);
			expect(result).toEqual(prescriptionData);
		});

		it('rejects when prescription does not exist', async () => {
			mocks.dbSelect.mockReturnValueOnce(createLimitChain([]));

			await expect(getPrescriptionById(PRESCRIPTION_ID)).rejects.toThrow(
				'Prescrição não encontrada',
			);

			expect(mocks.assertCanAccessPet).not.toHaveBeenCalled();
		});

		it('rejects customer when prescription belongs to another tutor', async () => {
			mocks.requireAuthContext.mockResolvedValue(customerContext);
			mocks.dbSelect.mockReturnValueOnce(
				createLimitChain([
					{
						id: PRESCRIPTION_ID,
						petId: PET_ID,
					},
				]),
			);
			mocks.prescriptionsFindFirst.mockResolvedValue({
				...prescriptionData,
				documentData: {
					tutor: {
						id: OTHER_TUTOR_ID,
						name: 'Outro Tutor',
					},
				},
			});
			mocks.canAccessTutorScopedData.mockReturnValue(false);

			await expect(getPrescriptionById(PRESCRIPTION_ID)).rejects.toThrow(
				'Prescrição não encontrada',
			);
		});

		it('sanitizes customer prescription data', async () => {
			mocks.requireAuthContext.mockResolvedValue(customerContext);
			mocks.dbSelect.mockReturnValueOnce(
				createLimitChain([
					{
						id: PRESCRIPTION_ID,
						petId: PET_ID,
					},
				]),
			);
			mocks.prescriptionsFindFirst.mockResolvedValue(prescriptionData);

			const result = await getPrescriptionById(PRESCRIPTION_ID);

			expect(mocks.sanitizeDoctorForCustomer).toHaveBeenCalledWith(doctor);
			expect(mocks.sanitizeTutorForCustomer).toHaveBeenCalledWith(ownTutor);
			expect(mocks.sanitizeTutorForCustomer).not.toHaveBeenCalledWith(
				otherTutor,
			);
			expect(mocks.sanitizeUserForCustomer).toHaveBeenCalledWith(
				prescriptionData.pet.weightHistory[0].author,
			);
			expect(result.pet.petTutors).toHaveLength(1);
			expect(result.pet.petTutors[0].tutor.id).toBe(TUTOR_ID);
		});
	});
});

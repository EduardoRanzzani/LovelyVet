import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	clinicalDocumentsTable,
	petNotesTable,
	petWeightsTable,
	prescriptionsTable,
	vaccinesTable,
} from '@/db/schema';

const mocks = vi.hoisted(() => ({
	vaccineFindFirst: vi.fn(),
	weightFindFirst: vi.fn(),
	noteFindFirst: vi.fn(),
	prescriptionFindFirst: vi.fn(),
	clinicalDocumentFindFirst: vi.fn(),
	deleteWhere: vi.fn(),
	dbDelete: vi.fn(),
	requireAuthContext: vi.fn(),
	requireStaff: vi.fn(),
	assertPrescriptionIsUnsigned: vi.fn(),
	revalidatePath: vi.fn(),
}));

vi.mock('@/db', () => ({
	db: {
		query: {
			vaccinesTable: {
				findFirst: mocks.vaccineFindFirst,
			},
			petWeightsTable: {
				findFirst: mocks.weightFindFirst,
			},
			petNotesTable: {
				findFirst: mocks.noteFindFirst,
			},
			prescriptionsTable: {
				findFirst: mocks.prescriptionFindFirst,
			},
			clinicalDocumentsTable: {
				findFirst: mocks.clinicalDocumentFindFirst,
			},
		},
		delete: mocks.dbDelete,
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

vi.mock('@/lib/prescriptions/prescription-signature', () => ({
	assertPrescriptionIsUnsigned: mocks.assertPrescriptionIsUnsigned,
}));

vi.mock('next/cache', () => ({
	revalidatePath: mocks.revalidatePath,
}));

import { deleteTimelineItem } from './timeline.actions';

const PET_ID = '11111111-1111-4111-8111-111111111111';
const ITEM_ID = '22222222-2222-4222-8222-222222222222';

const doctorContext = {
	clerkUserId: 'clerk-doctor',
	userId: 'user-doctor',
	role: 'doctor' as const,
	customerId: null,
	doctorId: '33333333-3333-4333-8333-333333333333',
};

describe('deleteTimelineItem', () => {
	beforeEach(() => {
		vi.resetAllMocks();

		mocks.requireAuthContext.mockResolvedValue(doctorContext);
		mocks.requireStaff.mockReturnValue(undefined);
		mocks.assertPrescriptionIsUnsigned.mockResolvedValue(undefined);
		mocks.deleteWhere.mockResolvedValue(undefined);
		mocks.dbDelete.mockReturnValue({
			where: mocks.deleteWhere,
		});
	});

	it('requires staff before deleting timeline item', async () => {
		mocks.requireStaff.mockImplementation(() => {
			throw new Error('Usuário não autorizado');
		});

		await expect(
			deleteTimelineItem({
				id: ITEM_ID,
				petId: PET_ID,
				type: 'vaccine',
			}),
		).rejects.toThrow('Usuário não autorizado');

		expect(mocks.vaccineFindFirst).not.toHaveBeenCalled();
		expect(mocks.dbDelete).not.toHaveBeenCalled();
	});

	it('deletes vaccine from pet timeline', async () => {
		mocks.vaccineFindFirst.mockResolvedValue({
			id: ITEM_ID,
			petId: PET_ID,
		});

		await deleteTimelineItem({
			id: ITEM_ID,
			petId: PET_ID,
			type: 'vaccine',
		});

		expect(mocks.vaccineFindFirst).toHaveBeenCalledTimes(1);
		expect(mocks.dbDelete).toHaveBeenCalledWith(vaccinesTable);
		expect(mocks.deleteWhere).toHaveBeenCalledTimes(1);
		expect(mocks.revalidatePath).toHaveBeenCalledWith(`/pets/${PET_ID}`);
	});

	it('rejects vaccine that does not belong to pet', async () => {
		mocks.vaccineFindFirst.mockResolvedValue(null);

		await expect(
			deleteTimelineItem({
				id: ITEM_ID,
				petId: PET_ID,
				type: 'vaccine',
			}),
		).rejects.toThrow('Vacina não encontrada');

		expect(mocks.dbDelete).not.toHaveBeenCalled();
	});

	it('deletes weight from pet timeline', async () => {
		mocks.weightFindFirst.mockResolvedValue({
			id: ITEM_ID,
			petId: PET_ID,
		});

		await deleteTimelineItem({
			id: ITEM_ID,
			petId: PET_ID,
			type: 'weight',
		});

		expect(mocks.weightFindFirst).toHaveBeenCalledTimes(1);
		expect(mocks.dbDelete).toHaveBeenCalledWith(petWeightsTable);
		expect(mocks.deleteWhere).toHaveBeenCalledTimes(1);
	});

	it('rejects weight that does not belong to pet', async () => {
		mocks.weightFindFirst.mockResolvedValue(null);

		await expect(
			deleteTimelineItem({
				id: ITEM_ID,
				petId: PET_ID,
				type: 'weight',
			}),
		).rejects.toThrow('Peso não encontrado');

		expect(mocks.dbDelete).not.toHaveBeenCalled();
	});

	it('deletes note from pet timeline', async () => {
		mocks.noteFindFirst.mockResolvedValue({
			id: ITEM_ID,
			petId: PET_ID,
		});

		await deleteTimelineItem({
			id: ITEM_ID,
			petId: PET_ID,
			type: 'note',
		});

		expect(mocks.noteFindFirst).toHaveBeenCalledTimes(1);
		expect(mocks.dbDelete).toHaveBeenCalledWith(petNotesTable);
		expect(mocks.deleteWhere).toHaveBeenCalledTimes(1);
	});

	it('rejects note that does not belong to pet', async () => {
		mocks.noteFindFirst.mockResolvedValue(null);

		await expect(
			deleteTimelineItem({
				id: ITEM_ID,
				petId: PET_ID,
				type: 'note',
			}),
		).rejects.toThrow('Observação não encontrada');

		expect(mocks.dbDelete).not.toHaveBeenCalled();
	});

	it('deletes unsigned prescription from pet timeline', async () => {
		mocks.prescriptionFindFirst.mockResolvedValue({
			id: ITEM_ID,
			petId: PET_ID,
		});

		await deleteTimelineItem({
			id: ITEM_ID,
			petId: PET_ID,
			type: 'prescription',
		});

		expect(mocks.prescriptionFindFirst).toHaveBeenCalledTimes(1);
		expect(mocks.assertPrescriptionIsUnsigned).toHaveBeenCalledWith(ITEM_ID);
		expect(mocks.dbDelete).toHaveBeenCalledWith(prescriptionsTable);
		expect(mocks.deleteWhere).toHaveBeenCalledTimes(1);
	});

	it('rejects prescription that does not belong to pet', async () => {
		mocks.prescriptionFindFirst.mockResolvedValue(null);

		await expect(
			deleteTimelineItem({
				id: ITEM_ID,
				petId: PET_ID,
				type: 'prescription',
			}),
		).rejects.toThrow('Prescrição não encontrada');

		expect(mocks.assertPrescriptionIsUnsigned).not.toHaveBeenCalled();
		expect(mocks.dbDelete).not.toHaveBeenCalled();
	});

	it('does not delete signed prescription', async () => {
		mocks.prescriptionFindFirst.mockResolvedValue({
			id: ITEM_ID,
			petId: PET_ID,
		});
		mocks.assertPrescriptionIsUnsigned.mockRejectedValue(
			new Error('Prescrição assinada não pode ser excluída'),
		);

		await expect(
			deleteTimelineItem({
				id: ITEM_ID,
				petId: PET_ID,
				type: 'prescription',
			}),
		).rejects.toThrow('Prescrição assinada não pode ser excluída');

		expect(mocks.dbDelete).not.toHaveBeenCalled();
	});

	it.each(['referral', 'exam_request'] as const)(
		'deletes %s from pet timeline',
		async (type) => {
			mocks.clinicalDocumentFindFirst.mockResolvedValue({
				id: ITEM_ID,
				petId: PET_ID,
				type,
			});

			await deleteTimelineItem({
				id: ITEM_ID,
				petId: PET_ID,
				type,
			});

			expect(mocks.clinicalDocumentFindFirst).toHaveBeenCalledTimes(1);
			expect(mocks.dbDelete).toHaveBeenCalledWith(clinicalDocumentsTable);
			expect(mocks.deleteWhere).toHaveBeenCalledTimes(1);
			expect(mocks.revalidatePath).toHaveBeenCalledWith(`/pets/${PET_ID}`);
		},
	);

	it.each(['referral', 'exam_request'] as const)(
		'rejects %s that does not belong to pet or has different type',
		async (type) => {
			mocks.clinicalDocumentFindFirst.mockResolvedValue(null);

			await expect(
				deleteTimelineItem({
					id: ITEM_ID,
					petId: PET_ID,
					type,
				}),
			).rejects.toThrow('Documento clínico não encontrado');

			expect(mocks.dbDelete).not.toHaveBeenCalled();
		},
	);
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prescriptionItemsTable } from '@/db/schema';

const mocks = vi.hoisted(() => ({
	findMany: vi.fn(),
	findFirst: vi.fn(),
	dbSelect: vi.fn(),
	selectFrom: vi.fn(),
	selectWhere: vi.fn(),
	dbInsert: vi.fn(),
	insertValues: vi.fn(),
	onConflictDoUpdate: vi.fn(),
	dbDelete: vi.fn(),
	deleteWhere: vi.fn(),
	requireAuthContext: vi.fn(),
	requireStaff: vi.fn(),
	sanitizeRichTextHtml: vi.fn(),
	normalizePagination: vi.fn(),
	revalidatePath: vi.fn(),
}));

vi.mock('@/db', () => ({
	db: {
		query: {
			prescriptionItemsTable: {
				findMany: mocks.findMany,
				findFirst: mocks.findFirst,
			},
		},
		select: mocks.dbSelect,
		insert: mocks.dbInsert,
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

vi.mock('@/lib/security/html', () => ({
	sanitizeRichTextHtml: mocks.sanitizeRichTextHtml,
}));

vi.mock('@/lib/pagination', () => ({
	normalizePagination: mocks.normalizePagination,
}));

vi.mock('next/cache', () => ({
	revalidatePath: mocks.revalidatePath,
}));

import {
	deletePrescriptionItem,
	getPrescriptionsItems,
	getPrescriptionsItemsPaginated,
	upsertPrescriptionItems,
} from './prescriptions-items.actions';

const ITEM_ID = '11111111-1111-4111-8111-111111111111';

const doctorContext = {
	clerkUserId: 'clerk-doctor',
	userId: 'user-doctor',
	role: 'doctor' as const,
	customerId: null,
	doctorId: '22222222-2222-4222-8222-222222222222',
};

const item = {
	id: ITEM_ID,
	name: 'Dipirona',
	pharmacy: 'Farmácia Veterinaria',
	quantity: '1 caixa',
	orientations: '<p>Administrar a cada 8 horas</p>',
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe('prescriptions items actions', () => {
	beforeEach(() => {
		vi.resetAllMocks();

		mocks.requireAuthContext.mockResolvedValue(doctorContext);
		mocks.requireStaff.mockReturnValue(undefined);
		mocks.sanitizeRichTextHtml.mockImplementation((content: string) => content);
		mocks.normalizePagination.mockReturnValue({
			page: 1,
			limit: 10,
			offset: 0,
		});

		mocks.selectWhere.mockResolvedValue([{ value: 1 }]);
		mocks.selectFrom.mockReturnValue({
			where: mocks.selectWhere,
		});
		mocks.dbSelect.mockReturnValue({
			from: mocks.selectFrom,
		});

		mocks.onConflictDoUpdate.mockResolvedValue(undefined);
		mocks.insertValues.mockReturnValue({
			onConflictDoUpdate: mocks.onConflictDoUpdate,
		});
		mocks.dbInsert.mockReturnValue({
			values: mocks.insertValues,
		});

		mocks.deleteWhere.mockResolvedValue(undefined);
		mocks.dbDelete.mockReturnValue({
			where: mocks.deleteWhere,
		});
	});

	describe('getPrescriptionsItems', () => {
		it('returns catalog for staff', async () => {
			mocks.findMany.mockResolvedValue([item]);

			const result = await getPrescriptionsItems();

			expect(mocks.requireStaff).toHaveBeenCalledWith(doctorContext);
			expect(mocks.findMany).toHaveBeenCalledTimes(1);
			expect(result).toEqual([item]);
		});

		it('rejects non staff user', async () => {
			mocks.requireStaff.mockImplementation(() => {
				throw new Error('Usuário não autorizado');
			});

			await expect(getPrescriptionsItems()).rejects.toThrow(
				'Usuário não autorizado',
			);

			expect(mocks.findMany).not.toHaveBeenCalled();
		});
	});

	describe('getPrescriptionsItemsPaginated', () => {
		it('returns normalized pagination metadata', async () => {
			mocks.normalizePagination.mockReturnValue({
				page: 2,
				limit: 5,
				offset: 5,
			});
			mocks.findMany.mockResolvedValue([item]);
			mocks.selectWhere.mockResolvedValue([{ value: 11 }]);

			const result = await getPrescriptionsItemsPaginated(2, 5, ' Dipirona ');

			expect(mocks.normalizePagination).toHaveBeenCalledWith(2, 5);
			expect(mocks.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					limit: 5,
					offset: 5,
				}),
			);
			expect(result).toEqual({
				data: [item],
				metadata: {
					totalCount: 11,
					pageCount: 3,
					currentPage: 2,
					limit: 5,
				},
			});
		});

		it('lists without filter when search is blank', async () => {
			mocks.findMany.mockResolvedValue([]);

			await getPrescriptionsItemsPaginated(1, 10, '   ');

			expect(mocks.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: undefined,
				}),
			);
			expect(mocks.selectWhere).toHaveBeenCalledWith(undefined);
		});
	});

	describe('upsertPrescriptionItems', () => {
		it('sanitizes orientations and saves catalog item', async () => {
			mocks.sanitizeRichTextHtml.mockReturnValue('<p>Orientação segura</p>');

			await upsertPrescriptionItems({
				id: ITEM_ID,
				name: 'Dipirona',
				pharmacy: 'Farmácia Veterinaria',
				quantity: '1 caixa',
				orientations: '<p>Orientação segura</p><script>alert(1)</script>',
			});

			expect(mocks.sanitizeRichTextHtml).toHaveBeenCalledWith(
				'<p>Orientação segura</p><script>alert(1)</script>',
			);
			expect(mocks.dbInsert).toHaveBeenCalledWith(prescriptionItemsTable);
			expect(mocks.insertValues).toHaveBeenCalledWith({
				id: ITEM_ID,
				name: 'Dipirona',
				pharmacy: 'Farmácia Veterinaria',
				quantity: '1 caixa',
				orientations: '<p>Orientação segura</p>',
			});
			expect(mocks.revalidatePath).toHaveBeenCalledWith('/prescriptions-items');
		});

		it('rejects invalid orientations after sanitization', async () => {
			mocks.sanitizeRichTextHtml.mockReturnValue('');

			await expect(
				upsertPrescriptionItems({
					name: 'Dipirona',
					pharmacy: 'Farmácia Veterinaria',
					quantity: '1 caixa',
					orientations: '<script>alert(1)</script>',
				}),
			).rejects.toThrow('Orientações inválidas');

			expect(mocks.dbInsert).not.toHaveBeenCalled();
		});
	});

	describe('deletePrescriptionItem', () => {
		it('deletes existing catalog item', async () => {
			mocks.findFirst.mockResolvedValue(item);

			await deletePrescriptionItem({
				id: ITEM_ID,
			});

			expect(mocks.findFirst).toHaveBeenCalledTimes(1);
			expect(mocks.dbDelete).toHaveBeenCalledWith(prescriptionItemsTable);
			expect(mocks.deleteWhere).toHaveBeenCalledTimes(1);
			expect(mocks.revalidatePath).toHaveBeenCalledWith('/prescriptions-items');
		});

		it('rejects missing catalog item', async () => {
			mocks.findFirst.mockResolvedValue(null);

			await expect(
				deletePrescriptionItem({
					id: ITEM_ID,
				}),
			).rejects.toThrow('Item de receita não encontrado');

			expect(mocks.dbDelete).not.toHaveBeenCalled();
		});
	});
});

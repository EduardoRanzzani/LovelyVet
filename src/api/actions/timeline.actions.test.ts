import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import {
	careRemindersTable,
	clinicalDocumentsTable,
	petNotesTable,
	petWeightsTable,
	prescriptionsTable,
	vaccinesTable,
} from '@/db/schema';
import { deletableTimelineItemTypes, type DeletableTimelineItemType } from '@/api/schema/timeline.schema';

const mocks = vi.hoisted(() => ({
	requireAuthContext: vi.fn(),
	transaction: vi.fn(),
	select: vi.fn(),
	from: vi.fn(),
	selectWhere: vi.fn(),
	lock: vi.fn(),
	signatureFindFirst: vi.fn(),
	dbDelete: vi.fn(),
	txDelete: vi.fn(),
	deleteWhere: vi.fn(),
	returning: vi.fn(),
	revalidatePath: vi.fn(),
}));

vi.mock('@/db', () => ({ db: { delete: mocks.dbDelete, transaction: mocks.transaction } }));
vi.mock('@/lib/next-safe-action', () => ({
	actionClient: {
		schema: () => ({
			action: (handler: (args: { parsedInput: unknown }) => unknown) => (parsedInput: unknown) =>
				handler({ parsedInput }),
		}),
	},
}));
vi.mock('@/lib/security/auth-context', () => ({ requireAuthContext: mocks.requireAuthContext }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));

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
const remove = (type: DeletableTimelineItemType) => deleteTimelineItem({ id: ITEM_ID, petId: PET_ID, type });
const dialect = new PgDialect();

const simpleCases = [
	['weight', petWeightsTable, 'Peso não encontrado'],
	['note', petNotesTable, 'Observação não encontrada'],
	['referral', clinicalDocumentsTable, 'Documento clínico não encontrado'],
	['exam_request', clinicalDocumentsTable, 'Documento clínico não encontrado'],
] as const;

const expectScope = (condition: Parameters<PgDialect['sqlToQuery']>[0]) => {
	const query = dialect.sqlToQuery(condition);
	expect(query.sql).toContain('pet_id');
	expect(query.params).toContain(ITEM_ID);
	expect(query.params).toContain(PET_ID);
	return query;
};

describe('deleteTimelineItem', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mocks.requireAuthContext.mockResolvedValue(doctorContext);
		mocks.select.mockReturnValue({ from: mocks.from });
		mocks.from.mockReturnValue({ where: mocks.selectWhere });
		mocks.selectWhere.mockReturnValue({ for: mocks.lock });
		// Um registro de outro profissional permanece elegível pela política aprovada.
		mocks.lock.mockResolvedValue([{ id: ITEM_ID, appointmentId: null, doctorId: 'other-doctor' }]);
		mocks.signatureFindFirst.mockResolvedValue(undefined);
		mocks.returning.mockResolvedValue([{ id: ITEM_ID }]);
		mocks.deleteWhere.mockReturnValue({ returning: mocks.returning });
		mocks.dbDelete.mockReturnValue({ where: mocks.deleteWhere });
		mocks.txDelete.mockReturnValue({ where: mocks.deleteWhere });
		mocks.transaction.mockImplementation(async (callback) =>
			callback({
				select: mocks.select,
				delete: mocks.txDelete,
				query: { prescriptionSignaturesTable: { findFirst: mocks.signatureFindFirst } },
			}),
		);
	});

	it.each(deletableTimelineItemTypes)('rejects Customer for %s using real authorization', async (type) => {
		mocks.requireAuthContext.mockResolvedValue({ ...doctorContext, role: 'customer', doctorId: null });
		await expect(remove(type)).rejects.toThrow('Usuário não autorizado');
		expect(mocks.dbDelete).not.toHaveBeenCalled();
		expect(mocks.transaction).not.toHaveBeenCalled();
		expect(mocks.revalidatePath).not.toHaveBeenCalled();
	});

	it('rejects unauthenticated requests before accessing the database', async () => {
		mocks.requireAuthContext.mockRejectedValue(new Error('Usuário não autenticado'));
		await expect(remove('note')).rejects.toThrow('Usuário não autenticado');
		expect(mocks.dbDelete).not.toHaveBeenCalled();
		expect(mocks.transaction).not.toHaveBeenCalled();
	});

	it.each(deletableTimelineItemTypes)('allows Admin to delete eligible %s', async (type) => {
		mocks.requireAuthContext.mockResolvedValue({ ...doctorContext, role: 'admin', doctorId: null });
		await remove(type);
		expect(mocks.returning).toHaveBeenCalledTimes(1);
		expect(mocks.revalidatePath).toHaveBeenCalledWith(`/pets/${PET_ID}`);
	});

	it.each(simpleCases)('allows Doctor to delete %s without filtering by author', async (type, table) => {
		await remove(type);
		expect(mocks.dbDelete).toHaveBeenCalledWith(table);
		const query = expectScope(mocks.deleteWhere.mock.calls[0][0]);
		expect(query.sql).not.toMatch(/author_id|doctor_id/);
		if (type === 'referral' || type === 'exam_request') {
			expect(query.sql).toContain('"type"');
			expect(query.params).toContain(type);
		}
		expect(mocks.returning).toHaveBeenCalledTimes(1);
		expect(mocks.revalidatePath).toHaveBeenCalledWith(`/pets/${PET_ID}`);
	});

	it.each(simpleCases)('rejects missing or wrong-scope %s atomically', async (type, _table, error) => {
		mocks.returning.mockResolvedValue([]);
		await expect(remove(type)).rejects.toThrow(error);
		expectScope(mocks.deleteWhere.mock.calls[0][0]);
		expect(mocks.revalidatePath).not.toHaveBeenCalled();
	});

	it('locks an eligible vaccine before removing its reminders and itself', async () => {
		await remove('vaccine');
		expect(mocks.transaction).toHaveBeenCalledTimes(1);
		expect(mocks.from).toHaveBeenCalledWith(vaccinesTable);
		expectScope(mocks.selectWhere.mock.calls[0][0]);
		expect(mocks.lock).toHaveBeenCalledWith('update');
		expect(mocks.txDelete).toHaveBeenNthCalledWith(1, careRemindersTable);
		expect(mocks.txDelete).toHaveBeenNthCalledWith(2, vaccinesTable);
		const reminder = expectScope(mocks.deleteWhere.mock.calls[0][0]);
		expect(reminder.sql).toContain('source_vaccine_id');
		expect(reminder.sql).not.toContain('"status"');
		const vaccine = expectScope(mocks.deleteWhere.mock.calls[1][0]);
		expect(vaccine.sql).toContain('"appointment_id" is null');
		expect(mocks.lock.mock.invocationCallOrder[0]).toBeLessThan(mocks.txDelete.mock.invocationCallOrder[0]);
		expect(mocks.dbDelete).not.toHaveBeenCalled();
		expect(mocks.revalidatePath).toHaveBeenCalledWith('/agenda');
		expect(mocks.revalidatePath).toHaveBeenCalledWith('/dashboard');
	});

	it.each(['admin', 'doctor'] as const)('blocks linked vaccine for %s before deleting reminders', async (role) => {
		mocks.requireAuthContext.mockResolvedValue({ ...doctorContext, role });
		mocks.lock.mockResolvedValue([{ id: ITEM_ID, appointmentId: 'appointment-id' }]);
		await expect(remove('vaccine')).rejects.toThrow('Vacina vinculada a atendimento');
		expect(mocks.txDelete).not.toHaveBeenCalled();
		expect(mocks.revalidatePath).not.toHaveBeenCalled();
	});

	it('rejects a missing or wrong-pet vaccine before deleting reminders', async () => {
		mocks.lock.mockResolvedValue([]);
		await expect(remove('vaccine')).rejects.toThrow('Vacina não encontrada');
		expect(mocks.txDelete).not.toHaveBeenCalled();
	});

	it('rejects the transaction if the vaccine deletion returns no row', async () => {
		mocks.returning.mockResolvedValue([]);
		await expect(remove('vaccine')).rejects.toThrow('Vacina não encontrada ou vinculada a atendimento');
		expect(mocks.txDelete).toHaveBeenCalledTimes(2);
		expect(mocks.revalidatePath).not.toHaveBeenCalled();
	});

	it('locks the prescription before checking its signature in the same transaction', async () => {
		await remove('prescription');
		expect(mocks.from).toHaveBeenCalledWith(prescriptionsTable);
		expectScope(mocks.selectWhere.mock.calls[0][0]);
		expect(mocks.lock).toHaveBeenCalledWith('update');
		expect(mocks.lock.mock.invocationCallOrder[0]).toBeLessThan(
			mocks.signatureFindFirst.mock.invocationCallOrder[0],
		);
		expect(mocks.signatureFindFirst.mock.invocationCallOrder[0]).toBeLessThan(
			mocks.txDelete.mock.invocationCallOrder[0],
		);
		expect(mocks.signatureFindFirst).toHaveBeenCalledWith(expect.objectContaining({ columns: { id: true } }));
		expect(mocks.txDelete).toHaveBeenCalledWith(prescriptionsTable);
		expectScope(mocks.deleteWhere.mock.calls[0][0]);
		expect(mocks.dbDelete).not.toHaveBeenCalled();
	});

	it.each(['admin', 'doctor'] as const)(
		'rejects a prescription signed before lock acquisition for %s',
		async (role) => {
			mocks.requireAuthContext.mockResolvedValue({ ...doctorContext, role });
			mocks.signatureFindFirst.mockResolvedValue({ id: 'signature-id' });
			await expect(remove('prescription')).rejects.toThrow('Esta receita foi assinada digitalmente');
			expect(mocks.txDelete).not.toHaveBeenCalled();
			expect(mocks.revalidatePath).not.toHaveBeenCalled();
		},
	);

	it('rejects a missing or wrong-pet prescription before querying signatures', async () => {
		mocks.lock.mockResolvedValue([]);
		await expect(remove('prescription')).rejects.toThrow('Prescrição não encontrada');
		expect(mocks.signatureFindFirst).not.toHaveBeenCalled();
		expect(mocks.txDelete).not.toHaveBeenCalled();
	});

	it('rejects a prescription delete with no returned row', async () => {
		mocks.returning.mockResolvedValue([]);
		await expect(remove('prescription')).rejects.toThrow('Prescrição não encontrada');
		expect(mocks.revalidatePath).not.toHaveBeenCalled();
	});
});

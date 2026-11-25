import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	requireAuthContext: vi.fn(),
	requireStaff: vi.fn(),
	findFirst: vi.fn(),
	dbUpdate: vi.fn(),
	updateSet: vi.fn(),
	updateWhere: vi.fn(),
	updateReturning: vi.fn(),
	dbDelete: vi.fn(),
	deleteWhere: vi.fn(),
	deleteReturning: vi.fn(),
	revalidatePath: vi.fn(),
}));

vi.mock('@/db', () => ({
	db: {
		query: {
			careRemindersTable: {
				findFirst: mocks.findFirst,
			},
		},
		delete: mocks.dbDelete,
		update: mocks.dbUpdate,
	},
}));

vi.mock('@/lib/next-safe-action', () => ({
	actionClient: {
		schema: () => ({
			action:
				(handler: (args: { parsedInput: { id: string } }) => Promise<unknown>) =>
				(parsedInput: { id: string }) =>
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

vi.mock('next/cache', () => ({
	revalidatePath: mocks.revalidatePath,
}));

import { deleteFinalizedCareReminder, rescheduleCareReminder } from './care-reminders.actions';

const ID = '11111111-1111-4111-8111-111111111111';
const PET_ID = '22222222-2222-4222-8222-222222222222';
const DOCTOR_ID = '33333333-3333-4333-8333-333333333333';

describe('deleteFinalizedCareReminder', () => {
	beforeEach(() => {
		vi.resetAllMocks();

		mocks.requireAuthContext.mockResolvedValue({
			role: 'doctor',
			doctorId: DOCTOR_ID,
		});

		mocks.findFirst.mockResolvedValue({
			id: ID,
			petId: PET_ID,
			doctorId: DOCTOR_ID,
			status: 'completed',
		});

		mocks.dbDelete.mockReturnValue({
			where: mocks.deleteWhere,
		});

		mocks.deleteWhere.mockReturnValue({
			returning: mocks.deleteReturning,
		});

		mocks.deleteReturning.mockResolvedValue([{ id: ID }]);
		mocks.dbUpdate.mockReturnValue({ set: mocks.updateSet });
		mocks.updateSet.mockReturnValue({ where: mocks.updateWhere });
		mocks.updateWhere.mockReturnValue({ returning: mocks.updateReturning });
		mocks.updateReturning.mockResolvedValue([{ id: ID, dueDate: '2026-11-24' }]);
	});

	it('exclui um lembrete concluído', async () => {
		await deleteFinalizedCareReminder({ id: ID });

		expect(mocks.dbDelete).toHaveBeenCalledOnce();
		expect(mocks.revalidatePath).toHaveBeenCalledWith('/agenda');
	});

	it('exclui um lembrete cancelado', async () => {
		mocks.findFirst.mockResolvedValue({
			id: ID,
			petId: PET_ID,
			doctorId: DOCTOR_ID,
			status: 'cancelled',
		});

		await deleteFinalizedCareReminder({ id: ID });

		expect(mocks.dbDelete).toHaveBeenCalledOnce();
	});

	it('não exclui um lembrete pendente', async () => {
		mocks.findFirst.mockResolvedValue({
			id: ID,
			petId: PET_ID,
			doctorId: DOCTOR_ID,
			status: 'pending',
		});

		await expect(deleteFinalizedCareReminder({ id: ID })).rejects.toThrow(
			'Lembretes pendentes não podem ser excluídos por esta ação.',
		);

		expect(mocks.dbDelete).not.toHaveBeenCalled();
	});

	it('impede excluir lembrete de outro veterinário', async () => {
		mocks.findFirst.mockResolvedValue({
			id: ID,
			petId: PET_ID,
			doctorId: '44444444-4444-4444-8444-444444444444',
			status: 'completed',
		});

		await expect(deleteFinalizedCareReminder({ id: ID })).rejects.toThrow(
			'Você não possui permissão para excluir este lembrete.',
		);

		expect(mocks.dbDelete).not.toHaveBeenCalled();
	});

	it('rejeita exclusão quando o registro foi alterado', async () => {
		mocks.deleteReturning.mockResolvedValue([]);

		await expect(deleteFinalizedCareReminder({ id: ID })).rejects.toThrow(
			'O lembrete foi alterado ou excluído por outra operação.',
		);
	});
});

describe('rescheduleCareReminder', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mocks.requireAuthContext.mockResolvedValue({ role: 'doctor', doctorId: DOCTOR_ID });
		mocks.findFirst.mockResolvedValue({
			id: ID,
			petId: PET_ID,
			doctorId: DOCTOR_ID,
			status: 'pending',
			dueDate: '2026-11-22',
		});
		mocks.dbUpdate.mockReturnValue({ set: mocks.updateSet });
		mocks.updateSet.mockReturnValue({ where: mocks.updateWhere });
		mocks.updateWhere.mockReturnValue({ returning: mocks.updateReturning });
		mocks.updateReturning.mockResolvedValue([{ id: ID, dueDate: '2026-11-24' }]);
	});

	it('reagenda uma pendência sem criar vacina ou atendimento', async () => {
		await expect(rescheduleCareReminder({ id: ID, dueDate: '2026-11-24' })).resolves.toEqual({
			success: true,
			dueDate: '2026-11-24',
		});
		expect(mocks.updateSet).toHaveBeenCalledWith(expect.objectContaining({ dueDate: '2026-11-24' }));
		expect(mocks.revalidatePath).toHaveBeenCalledWith('/agenda');
		expect(mocks.revalidatePath).toHaveBeenCalledWith('/appointments');
	});

	it('não altera lembrete finalizado', async () => {
		mocks.findFirst.mockResolvedValue({
			id: ID,
			petId: PET_ID,
			doctorId: DOCTOR_ID,
			status: 'completed',
			dueDate: '2026-11-22',
		});
		await expect(rescheduleCareReminder({ id: ID, dueDate: '2026-11-24' })).rejects.toThrow(
			'Apenas lembretes pendentes',
		);
		expect(mocks.dbUpdate).not.toHaveBeenCalled();
	});

	it('impede reagendamento de outro veterinário', async () => {
		mocks.findFirst.mockResolvedValue({
			id: ID,
			petId: PET_ID,
			doctorId: '44444444-4444-4444-8444-444444444444',
			status: 'pending',
			dueDate: '2026-11-22',
		});
		await expect(rescheduleCareReminder({ id: ID, dueDate: '2026-11-24' })).rejects.toThrow('permissão');
		expect(mocks.dbUpdate).not.toHaveBeenCalled();
	});

	it('impede sobrescrever alteração concorrente', async () => {
		mocks.updateReturning.mockResolvedValue([]);
		await expect(rescheduleCareReminder({ id: ID, dueDate: '2026-11-24' })).rejects.toThrow(
			'alterado por outra operação',
		);
	});

	it('não faz update se a data já é igual', async () => {
		await expect(rescheduleCareReminder({ id: ID, dueDate: '2026-11-22' })).resolves.toEqual({
			success: true,
			dueDate: '2026-11-22',
		});
		expect(mocks.dbUpdate).not.toHaveBeenCalled();
	});
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	requireAuthContext: vi.fn(),
	resolveClinicalDoctorId: vi.fn(),
	assertCanAccessPet: vi.fn(),
	transaction: vi.fn(),
	reminderFindFirst: vi.fn(),
	vaccineFindFirst: vi.fn(),
	update: vi.fn(),
	updateSet: vi.fn(),
	updateWhere: vi.fn(),
	updateReturning: vi.fn(),
	insert: vi.fn(),
	insertValues: vi.fn(),
	onConflictDoUpdate: vi.fn(),
	insertReturning: vi.fn(),
	revalidatePath: vi.fn(),
}));

vi.mock('@/db', () => ({
	db: {
		transaction: mocks.transaction,
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

vi.mock('@/lib/security/clinical-access', () => ({
	resolveClinicalDoctorId: mocks.resolveClinicalDoctorId,
}));

vi.mock('@/lib/security/pet-access', () => ({
	assertCanAccessPet: mocks.assertCanAccessPet,
}));

vi.mock('next/cache', () => ({
	revalidatePath: mocks.revalidatePath,
}));

import { insertVaccine } from './pet-vaccines.actions';

const PET_ID = '11111111-1111-4111-8111-111111111111';
const DOCTOR_ID = '22222222-2222-4222-8222-222222222222';
const REMINDER_ID = '33333333-3333-4333-8333-333333333333';
const VACCINE_ID = '44444444-4444-4444-8444-444444444444';

const input = {
	petId: PET_ID,
	reminderId: REMINDER_ID,
	name: 'V10',
	applicationDate: new Date(2026, 10, 20, 12),
	nextDoseType: 'none' as const,
	doctorId: DOCTOR_ID,
};

const pendingReminder = {
	id: REMINDER_ID,
	petId: PET_ID,
	doctorId: DOCTOR_ID,
	type: 'vaccine',
	status: 'pending',
	sourceVaccineId: VACCINE_ID,
};

describe('insertVaccine com lembrete', () => {
	beforeEach(() => {
		vi.resetAllMocks();

		mocks.requireAuthContext.mockResolvedValue({
			role: 'doctor',
			doctorId: DOCTOR_ID,
		});

		mocks.resolveClinicalDoctorId.mockReturnValue(DOCTOR_ID);
		mocks.reminderFindFirst.mockResolvedValue(pendingReminder);
		mocks.updateReturning.mockResolvedValue([{ id: REMINDER_ID }]);
		mocks.insertReturning.mockResolvedValue([{ id: VACCINE_ID }]);
		mocks.vaccineFindFirst.mockResolvedValue(undefined);

		mocks.update.mockReturnValue({ set: mocks.updateSet });
		mocks.updateSet.mockReturnValue({
			where: mocks.updateWhere,
		});
		mocks.updateWhere.mockReturnValue({
			returning: mocks.updateReturning,
		});

		mocks.insert.mockReturnValue({
			values: mocks.insertValues,
		});
		mocks.insertValues.mockReturnValue({
			onConflictDoUpdate: mocks.onConflictDoUpdate,
		});
		mocks.onConflictDoUpdate.mockReturnValue({
			returning: mocks.insertReturning,
		});

		mocks.transaction.mockImplementation(async (callback) =>
			callback({
				query: {
					careRemindersTable: {
						findFirst: mocks.reminderFindFirst,
					},
					vaccinesTable: {
						findFirst: mocks.vaccineFindFirst,
					},
				},
				update: mocks.update,
				insert: mocks.insert,
			}),
		);
	});

	it('conclui o lembrete e registra a aplicação', async () => {
		// Primeira consulta: lembrete original pendente.
		// Segunda consulta: nova vacina sem lembrete associado.
		mocks.reminderFindFirst
			.mockResolvedValueOnce(pendingReminder)
			.mockResolvedValueOnce(undefined);

		await insertVaccine(input);

		// O lembrete original deve ser concluído.
		expect(mocks.updateReturning).toHaveBeenCalledOnce();

		// A nova vacina deve ser registrada.
		expect(mocks.insertReturning).toHaveBeenCalledOnce();

		// Ambas as operações devem utilizar a mesma transação.
		expect(mocks.transaction).toHaveBeenCalledOnce();

		// Não deve criar lembrete adicional,
		// pois nextDoseType é 'none'.
		expect(mocks.insert).toHaveBeenCalledOnce();

		// As duas consultas devem ter sido realizadas.
		expect(mocks.reminderFindFirst).toHaveBeenCalledTimes(2);
	});

	it('rejeita lembrete de outro paciente', async () => {
		mocks.reminderFindFirst.mockResolvedValue({
			...pendingReminder,
			petId: '55555555-5555-4555-8555-555555555555',
		});

		await expect(insertVaccine(input)).rejects.toThrow(
			'O lembrete não corresponde à vacinação deste paciente.',
		);

		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it('rejeita lembrete já concluído', async () => {
		mocks.reminderFindFirst.mockResolvedValue({
			...pendingReminder,
			status: 'completed',
		});

		await expect(insertVaccine(input)).rejects.toThrow(
			'Este lembrete já foi finalizado.',
		);

		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it('impede conclusão simultânea duplicada', async () => {
		mocks.updateReturning.mockResolvedValue([]);

		await expect(insertVaccine(input)).rejects.toThrow(
			'Este lembrete já foi finalizado por outra operação.',
		);

		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it('rejeita edição de vacina vinculada à conclusão', async () => {
		await expect(
			insertVaccine({
				...input,
				id: VACCINE_ID,
			}),
		).rejects.toThrow(
			'Não é permitido editar uma vacina ao concluir um lembrete.',
		);

		expect(mocks.transaction).not.toHaveBeenCalled();
	});
});

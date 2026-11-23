import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	requireAuthContext: vi.fn(),
	resolveClinicalDoctorId: vi.fn(),
	assertCanAccessPet: vi.fn(),
	transaction: vi.fn(),
	reminderFindFirst: vi.fn(),
	vaccineFindFirst: vi.fn(),
	serviceFindFirst: vi.fn(),
	petFindFirst: vi.fn(),
	update: vi.fn(),
	updateSet: vi.fn(),
	updateWhere: vi.fn(),
	updateReturning: vi.fn(),
	insert: vi.fn(),
	insertValues: vi.fn(),
	onConflictDoUpdate: vi.fn(),
	insertReturning: vi.fn(),
	appointmentReturning: vi.fn(),
	appointmentFindFirst: vi.fn(),
	appointmentItemFindFirst: vi.fn(),
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
		mocks.appointmentReturning.mockResolvedValue([{ id: '88888888-8888-4888-8888-888888888888' }]);
		mocks.appointmentFindFirst.mockResolvedValue(undefined);
		mocks.appointmentItemFindFirst.mockResolvedValue(undefined);
		mocks.vaccineFindFirst.mockResolvedValue(undefined);
		mocks.serviceFindFirst.mockResolvedValue(undefined);

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
			returning: mocks.appointmentReturning,
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
					servicesTable: { findFirst: mocks.serviceFindFirst },
					petsTable: { findFirst: mocks.petFindFirst },
					appointmentsTable: { findFirst: mocks.appointmentFindFirst },
					appointmentItemsTable: { findFirst: mocks.appointmentItemFindFirst },
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

	it('impede associar um serviço que não é vacina', async () => {
		mocks.serviceFindFirst.mockResolvedValue({
			id: '55555555-5555-4555-8555-555555555555',
			name: 'Consulta',
			isVaccine: false,
		});
		await expect(insertVaccine({
			...input,
			serviceId: '55555555-5555-4555-8555-555555555555',
		})).rejects.toThrow('Serviço de vacina inválido ou não encontrado.');
		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it('usa o nome oficial do serviço escolhido', async () => {
		mocks.serviceFindFirst.mockResolvedValue({
			id: '55555555-5555-4555-8555-555555555555',
			name: 'Vacina V10',
			isVaccine: true,
			priceInCents: 8500, durationMinutes: 30,
		});
		mocks.reminderFindFirst
			.mockResolvedValueOnce(pendingReminder)
			.mockResolvedValueOnce(undefined);
		await insertVaccine({
			...input,
			name: 'Nome adulterado',
			serviceId: '55555555-5555-4555-8555-555555555555',
		});
		expect(mocks.insertValues).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'Vacina V10',
				serviceId: '55555555-5555-4555-8555-555555555555',
			}),
		);
	});

	it('rejeita vacina de espécie diferente da espécie do pet', async () => {
		mocks.serviceFindFirst.mockResolvedValue({
			id: '55555555-5555-4555-8555-555555555555',
			name: 'Vacina felina',
			isVaccine: true,
			specieId: '66666666-6666-4666-8666-666666666666',
		});
		mocks.petFindFirst.mockResolvedValue({
			breed: { specieId: '77777777-7777-4777-8777-777777777777' },
		});
		await expect(insertVaccine({
			...input,
			serviceId: '55555555-5555-4555-8555-555555555555',
		})).rejects.toThrow('Vacina não indicada para a espécie do paciente.');
		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it('cria atendimento realizado e item com preço histórico na mesma transação', async () => {
		mocks.serviceFindFirst.mockResolvedValue({
			id: '55555555-5555-4555-8555-555555555555',
			name: 'Vacina V10', isVaccine: true, priceInCents: 8500, durationMinutes: 30,
		});
		mocks.reminderFindFirst.mockResolvedValue(undefined);
		await insertVaccine({ ...input, reminderId: undefined, serviceId: '55555555-5555-4555-8555-555555555555' });
		expect(mocks.insertValues).toHaveBeenCalledWith(expect.objectContaining({
			status: 'completed', petId: PET_ID, doctorId: DOCTOR_ID,
			// Data do teste é retroativa: jamais criar valor a receber antigo.
			totalPriceInCents: 0,
		}));
		expect(mocks.insertValues).toHaveBeenCalledWith(expect.objectContaining({
			serviceId: '55555555-5555-4555-8555-555555555555', priceAtTimeInCents: 0,
		}));
		expect(mocks.updateSet).toHaveBeenCalledWith(expect.objectContaining({
			appointmentId: '88888888-8888-4888-8888-888888888888',
		}));
		expect(mocks.transaction).toHaveBeenCalledOnce();
	});

	it('não duplica a aplicação quando uma operação já foi processada', async () => {
		mocks.vaccineFindFirst.mockResolvedValue({ id: VACCINE_ID, petId: PET_ID, doctorId: DOCTOR_ID });
		await insertVaccine({ ...input, reminderId: undefined, operationKey: '99999999-9999-4999-8999-999999999999' });
		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it('rejeita reutilização de chave de operação para outro pet', async () => {
		mocks.vaccineFindFirst.mockResolvedValue({ id: VACCINE_ID, petId: '00000000-0000-4000-8000-000000000000', doctorId: DOCTOR_ID });
		await expect(insertVaccine({ ...input, reminderId: undefined, operationKey: '99999999-9999-4999-8999-999999999999' })).rejects.toThrow('Identificador de operação já utilizado.');
		expect(mocks.insert).not.toHaveBeenCalled();
	});

});

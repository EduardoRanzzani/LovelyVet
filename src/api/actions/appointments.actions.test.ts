import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
	const txReturning = vi.fn();
	const txValues = vi.fn();
	const txInsert = vi.fn();
	const txUpdateWhere = vi.fn();
	const txUpdateSet = vi.fn();
	const txUpdate = vi.fn();
	const txDeleteWhere = vi.fn();
	const txDelete = vi.fn();
	const dbUpdateWhere = vi.fn();
	const dbUpdateSet = vi.fn();
	const dbUpdate = vi.fn();
	const dbDeleteWhere = vi.fn();
	const dbDelete = vi.fn();
	const tx = {
		query: {
			servicesTable: { findMany: vi.fn() },
			doctorsTable: { findFirst: vi.fn() },
			appointmentsTable: { findFirst: vi.fn() },
			shiftsTable: { findFirst: vi.fn() },
			calendarEventsTable: { findFirst: vi.fn() },
		},
		execute: vi.fn(),
		insert: txInsert,
		update: txUpdate,
		delete: txDelete,
	};

	return {
		tx,
		txReturning,
		txValues,
		txInsert,
		txUpdateWhere,
		txUpdateSet,
		txUpdate,
		txDeleteWhere,
		txDelete,
		dbUpdateWhere,
		dbUpdateSet,
		dbUpdate,
		dbDeleteWhere,
		dbDelete,
		transaction: vi.fn(),
		requireAuthContext: vi.fn(),
		requireStaff: vi.fn(),
		assertCanAccessPet: vi.fn(),
		requireAccessibleAppointment: vi.fn(),
		buildAppointmentAccessCondition: vi.fn(),
		assertIntervalWithinDoctorWorkingHours: vi.fn(),
		revalidatePath: vi.fn(),
	};
});

vi.mock('@/db', () => ({
	db: {
		transaction: mocks.transaction,
		update: mocks.dbUpdate,
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

vi.mock('@/lib/security/pet-access', () => ({
	assertCanAccessPet: mocks.assertCanAccessPet,
}));

vi.mock('@/lib/security/appointment-access', () => ({
	requireAccessibleAppointment: mocks.requireAccessibleAppointment,
	buildAppointmentAccessCondition: mocks.buildAppointmentAccessCondition,
}));

vi.mock('@/lib/scheduling/doctor-working-hours', () => ({
	assertIntervalWithinDoctorWorkingHours:
		mocks.assertIntervalWithinDoctorWorkingHours,
}));

vi.mock('next/cache', () => ({
	revalidatePath: mocks.revalidatePath,
}));

import {
	deleteAppointment,
	markAppointmentAsCancelled,
	markAppointmentAsCompleted,
	markAsConfirmed,
	upsertAppointment,
} from './appointments.actions';

const PET_ID = '11111111-1111-4111-8111-111111111111';
const DOCTOR_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_DOCTOR_ID = '66666666-6666-4666-8666-666666666666';
const SERVICE_ID_1 = '33333333-3333-4333-8333-333333333333';
const SERVICE_ID_2 = '44444444-4444-4444-8444-444444444444';
const APPOINTMENT_ID = '55555555-5555-4555-8555-555555555555';
const SCHEDULED_AT = new Date('2026-09-28T13:00:00.000Z');

const customerContext = {
	clerkUserId: 'clerk-customer',
	userId: 'user-customer',
	role: 'customer' as const,
	customerId: 'customer-id',
	doctorId: null,
};

const doctorContext = {
	clerkUserId: 'clerk-doctor',
	userId: 'user-doctor',
	role: 'doctor' as const,
	customerId: null,
	doctorId: DOCTOR_ID,
};

const adminContext = {
	clerkUserId: 'clerk-admin',
	userId: 'user-admin',
	role: 'admin' as const,
	customerId: null,
	doctorId: null,
};

const baseInput = {
	petId: PET_ID,
	doctorId: DOCTOR_ID,
	scheduledAt: SCHEDULED_AT,
	status: 'completed' as const,
	totalPriceInCents: 999999,
	notes: 'Observação',
	services: [SERVICE_ID_1, SERVICE_ID_2],
};

const servicesData = [
	{
		id: SERVICE_ID_1,
		priceInCents: 5000,
		durationMinutes: 30,
	},
	{
		id: SERVICE_ID_2,
		priceInCents: 3500,
		durationMinutes: 20,
	},
];

const doctorData = {
	id: DOCTOR_ID,
	availableFromWeekDay: 0,
	availableToWeekDay: 6,
	availableFromTime: '00:00',
	availableToTime: '23:59',
};

describe('appointments actions', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.spyOn(console, 'error').mockImplementation(() => undefined);

		mocks.requireAuthContext.mockResolvedValue(customerContext);
		mocks.requireStaff.mockReturnValue(undefined);
		mocks.assertCanAccessPet.mockResolvedValue(undefined);
		mocks.requireAccessibleAppointment.mockResolvedValue({
			id: APPOINTMENT_ID,
			status: 'pending',
		});
		mocks.assertIntervalWithinDoctorWorkingHours.mockReturnValue(undefined);

		mocks.tx.query.servicesTable.findMany.mockResolvedValue(servicesData);
		mocks.tx.query.doctorsTable.findFirst.mockResolvedValue(doctorData);
		mocks.tx.query.appointmentsTable.findFirst.mockResolvedValue(null);
		mocks.tx.query.shiftsTable.findFirst.mockResolvedValue(null);
		mocks.tx.query.calendarEventsTable.findFirst.mockResolvedValue(null);
		mocks.tx.execute.mockResolvedValue(undefined);

		mocks.txReturning.mockResolvedValue([{ id: APPOINTMENT_ID }]);
		mocks.txValues.mockReturnValue({ returning: mocks.txReturning });
		mocks.txInsert.mockReturnValue({ values: mocks.txValues });
		mocks.txUpdateSet.mockReturnValue({ where: mocks.txUpdateWhere });
		mocks.txUpdate.mockReturnValue({ set: mocks.txUpdateSet });
		mocks.txDelete.mockReturnValue({ where: mocks.txDeleteWhere });

		mocks.dbUpdateSet.mockReturnValue({ where: mocks.dbUpdateWhere });
		mocks.dbUpdate.mockReturnValue({ set: mocks.dbUpdateSet });
		mocks.dbDelete.mockReturnValue({ where: mocks.dbDeleteWhere });

		mocks.transaction.mockImplementation(
			async (callback: (tx: typeof mocks.tx) => Promise<unknown>) =>
				callback(mocks.tx),
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('upsertAppointment', () => {
		it('derives price, status and duration on backend for customer', async () => {
			const result = await upsertAppointment(baseInput);

			expect(result).toEqual({ success: true });
			expect(mocks.assertCanAccessPet).toHaveBeenCalledWith(
				customerContext,
				PET_ID,
			);
			expect(mocks.assertIntervalWithinDoctorWorkingHours).toHaveBeenCalledWith(
				{
					start: SCHEDULED_AT,
					end: new Date('2026-09-28T13:50:00.000Z'),
				},
				doctorData,
			);
			expect(mocks.txValues).toHaveBeenNthCalledWith(
				1,
				expect.objectContaining({
					petId: PET_ID,
					doctorId: DOCTOR_ID,
					scheduledAt: SCHEDULED_AT,
					endsAt: new Date('2026-09-28T13:50:00.000Z'),
					status: 'pending',
					totalPriceInCents: 8500,
					notes: 'Observação',
				}),
			);
			expect(mocks.txValues).toHaveBeenNthCalledWith(2, [
				{
					appointmentId: APPOINTMENT_ID,
					serviceId: SERVICE_ID_1,
					priceAtTimeInCents: 5000,
				},
				{
					appointmentId: APPOINTMENT_ID,
					serviceId: SERVICE_ID_2,
					priceAtTimeInCents: 3500,
				},
			]);
			expect(mocks.revalidatePath).toHaveBeenCalledWith('/appointments');
		});

		it('uses negotiated price and requested status for staff', async () => {
			mocks.requireAuthContext.mockResolvedValue(adminContext);

			await upsertAppointment({
				...baseInput,
				status: 'confirmed',
				totalPriceInCents: 72.5,
			});

			expect(mocks.txValues).toHaveBeenNthCalledWith(
				1,
				expect.objectContaining({
					status: 'confirmed',
					totalPriceInCents: 7250,
				}),
			);
		});

		it('rejects invalid service ids', async () => {
			mocks.tx.query.servicesTable.findMany.mockResolvedValue([
				servicesData[0],
			]);

			await expect(upsertAppointment(baseInput)).rejects.toThrow(
				'Um ou mais serviços selecionados são inválidos',
			);
		});

		it('rejects appointment with invalid total duration', async () => {
			mocks.tx.query.servicesTable.findMany.mockResolvedValue(
				servicesData.map((service) => ({
					...service,
					durationMinutes: 0,
				})),
			);

			await expect(upsertAppointment(baseInput)).rejects.toThrow(
				'A duração total do atendimento é inválida',
			);
		});

		it('rejects appointment when doctor does not exist', async () => {
			mocks.tx.query.doctorsTable.findFirst.mockResolvedValue(null);

			await expect(upsertAppointment(baseInput)).rejects.toThrow(
				'Veterinário não encontrado.',
			);
		});

		it('rejects appointment outside doctor working hours', async () => {
			mocks.assertIntervalWithinDoctorWorkingHours.mockImplementation(() => {
				throw new Error(
					'O horário selecionado está fora do horário de atendimento deste veterinário.',
				);
			});

			await expect(upsertAppointment(baseInput)).rejects.toThrow(
				'O horário selecionado está fora do horário de atendimento deste veterinário.',
			);
		});

		it('prevents doctor from using another doctor id', async () => {
			mocks.requireAuthContext.mockResolvedValue(doctorContext);

			await expect(
				upsertAppointment({
					...baseInput,
					doctorId: OTHER_DOCTOR_ID,
				}),
			).rejects.toThrow(
				'Você não possui permissão para utilizar este veterinário.',
			);

			expect(mocks.transaction).not.toHaveBeenCalled();
		});

		it('rejects customer update when appointment is not pending', async () => {
			mocks.requireAccessibleAppointment.mockResolvedValue({
				id: APPOINTMENT_ID,
				status: 'confirmed',
			});

			await expect(
				upsertAppointment({
					...baseInput,
					id: APPOINTMENT_ID,
				}),
			).rejects.toThrow('Apenas agendamentos pendentes podem ser alterados');

			expect(mocks.transaction).not.toHaveBeenCalled();
		});

		it('updates pending appointment and replaces its services', async () => {
			await upsertAppointment({
				...baseInput,
				id: APPOINTMENT_ID,
			});

			expect(mocks.requireAccessibleAppointment).toHaveBeenCalledWith(
				customerContext,
				APPOINTMENT_ID,
			);
			expect(mocks.txUpdateSet).toHaveBeenCalledWith(
				expect.objectContaining({
					petId: PET_ID,
					doctorId: DOCTOR_ID,
					status: 'pending',
					totalPriceInCents: 8500,
				}),
			);
			expect(mocks.txUpdateWhere).toHaveBeenCalledTimes(1);
			expect(mocks.txDeleteWhere).toHaveBeenCalledTimes(1);
			expect(mocks.txValues).toHaveBeenCalledWith([
				{
					appointmentId: APPOINTMENT_ID,
					serviceId: SERVICE_ID_1,
					priceAtTimeInCents: 5000,
				},
				{
					appointmentId: APPOINTMENT_ID,
					serviceId: SERVICE_ID_2,
					priceAtTimeInCents: 3500,
				},
			]);
		});

		it('rejects conflict with another appointment', async () => {
			mocks.tx.query.appointmentsTable.findFirst.mockResolvedValue({
				id: 'appointment-conflict',
			});

			await expect(upsertAppointment(baseInput)).rejects.toThrow(
				'O horário selecionado não está disponível para este veterinário.',
			);
		});

		it('rejects conflict with shift', async () => {
			mocks.tx.query.shiftsTable.findFirst.mockResolvedValue({
				id: 'shift-conflict',
			});

			await expect(upsertAppointment(baseInput)).rejects.toThrow(
				'O horário selecionado não está disponível para este veterinário.',
			);
		});

		it('rejects conflict with personal calendar event', async () => {
			mocks.tx.query.calendarEventsTable.findFirst.mockResolvedValue({
				id: 'event-conflict',
			});

			await expect(upsertAppointment(baseInput)).rejects.toThrow(
				'O horário selecionado não está disponível para este veterinário.',
			);
		});

		it('throws when appointment creation returns no id', async () => {
			mocks.txReturning.mockResolvedValue([]);

			await expect(upsertAppointment(baseInput)).rejects.toThrow(
				'Erro ao criar agendamento',
			);
		});

		it('normalizes unknown transaction errors', async () => {
			mocks.transaction.mockRejectedValue('unexpected-error');

			await expect(upsertAppointment(baseInput)).rejects.toThrow(
				'Ocorreu um erro inesperado ao salvar o agendamento.',
			);
		});
	});

	describe('deleteAppointment', () => {
		it('requires staff, validates access and deletes appointment', async () => {
			mocks.requireAuthContext.mockResolvedValue(adminContext);

			await deleteAppointment({ id: APPOINTMENT_ID });

			expect(mocks.requireStaff).toHaveBeenCalledWith(adminContext);
			expect(mocks.requireAccessibleAppointment).toHaveBeenCalledWith(
				adminContext,
				APPOINTMENT_ID,
			);
			expect(mocks.dbDelete).toHaveBeenCalledTimes(1);
			expect(mocks.dbDeleteWhere).toHaveBeenCalledTimes(1);
			expect(mocks.revalidatePath).toHaveBeenCalledWith('/appointments');
		});

		it('rejects when accessible appointment is not found', async () => {
			mocks.requireAuthContext.mockResolvedValue(adminContext);
			mocks.requireAccessibleAppointment.mockResolvedValue(null);

			await expect(deleteAppointment({ id: APPOINTMENT_ID })).rejects.toThrow(
				'Agendamento não encontrado',
			);

			expect(mocks.dbDelete).not.toHaveBeenCalled();
		});
	});

	describe('markAsConfirmed', () => {
		it('confirms pending appointment', async () => {
			mocks.requireAuthContext.mockResolvedValue(doctorContext);

			await markAsConfirmed({ id: APPOINTMENT_ID });

			expect(mocks.requireStaff).toHaveBeenCalledWith(doctorContext);
			expect(mocks.dbUpdateSet).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 'confirmed',
				}),
			);
			expect(mocks.dbUpdateWhere).toHaveBeenCalledTimes(1);
			expect(mocks.revalidatePath).toHaveBeenCalledWith('/appointments');
		});

		it('rejects confirmation when appointment is not pending', async () => {
			mocks.requireAuthContext.mockResolvedValue(doctorContext);
			mocks.requireAccessibleAppointment.mockResolvedValue({
				id: APPOINTMENT_ID,
				status: 'confirmed',
			});

			await expect(markAsConfirmed({ id: APPOINTMENT_ID })).rejects.toThrow(
				'Apenas agendamentos pendentes podem ser confirmados',
			);

			expect(mocks.dbUpdate).not.toHaveBeenCalled();
		});
	});

	describe('markAppointmentAsCompleted', () => {
		it.each(['confirmed', 'in_progress'] as const)(
			'completes appointment with %s status',
			async (status) => {
				mocks.requireAuthContext.mockResolvedValue(doctorContext);
				mocks.requireAccessibleAppointment.mockResolvedValue({
					id: APPOINTMENT_ID,
					status,
				});

				await markAppointmentAsCompleted({
					id: APPOINTMENT_ID,
				});

				expect(mocks.requireStaff).toHaveBeenCalledWith(doctorContext);
				expect(mocks.dbUpdateSet).toHaveBeenCalledWith(
					expect.objectContaining({
						status: 'completed',
					}),
				);
				expect(mocks.dbUpdateWhere).toHaveBeenCalledTimes(1);
			},
		);

		it('rejects completion when appointment has invalid status', async () => {
			mocks.requireAuthContext.mockResolvedValue(doctorContext);
			mocks.requireAccessibleAppointment.mockResolvedValue({
				id: APPOINTMENT_ID,
				status: 'pending',
			});

			await expect(
				markAppointmentAsCompleted({
					id: APPOINTMENT_ID,
				}),
			).rejects.toThrow(
				'O agendamento precisa estar confirmado ou em atendimento para ser concluído',
			);

			expect(mocks.dbUpdate).not.toHaveBeenCalled();
		});
	});

	describe('markAppointmentAsCancelled', () => {
		it('allows accessible pending appointment to be cancelled', async () => {
			await markAppointmentAsCancelled({
				id: APPOINTMENT_ID,
			});

			expect(mocks.requireAccessibleAppointment).toHaveBeenCalledWith(
				customerContext,
				APPOINTMENT_ID,
			);
			expect(mocks.requireStaff).not.toHaveBeenCalled();
			expect(mocks.dbUpdateSet).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 'cancelled',
				}),
			);
			expect(mocks.dbUpdateWhere).toHaveBeenCalledTimes(1);
			expect(mocks.revalidatePath).toHaveBeenCalledWith('/appointments');
		});

		it('rejects cancellation when appointment is not pending', async () => {
			mocks.requireAccessibleAppointment.mockResolvedValue({
				id: APPOINTMENT_ID,
				status: 'confirmed',
			});

			await expect(
				markAppointmentAsCancelled({
					id: APPOINTMENT_ID,
				}),
			).rejects.toThrow('Apenas agendamentos pendentes podem ser cancelados');

			expect(mocks.dbUpdate).not.toHaveBeenCalled();
		});
	});
});

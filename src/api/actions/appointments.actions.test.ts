import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
	const txReturning = vi.fn();
	const txValues = vi.fn();
	const txInsert = vi.fn();
	const txUpdateWhere = vi.fn();
	const txUpdateReturning = vi.fn();
	const txUpdateSet = vi.fn();
	const txUpdate = vi.fn();
	const txDeleteWhere = vi.fn();
	const txDelete = vi.fn();
	const dbUpdateReturning = vi.fn();
	const dbUpdateWhere = vi.fn();
	const dbUpdateSet = vi.fn();
	const dbUpdate = vi.fn();
	const dbDeleteWhere = vi.fn();
	const dbDelete = vi.fn();
	const tx = {
		query: {
			servicesTable: { findMany: vi.fn() },
			doctorsTable: { findFirst: vi.fn() },
			appointmentsTable: { findFirst: vi.fn(), findMany: vi.fn() },
			shiftsTable: { findFirst: vi.fn(), findMany: vi.fn() },
			calendarEventsTable: { findFirst: vi.fn(), findMany: vi.fn() },
			appointmentChargesTable: { findFirst: vi.fn() },
			appointmentProductItemsTable: { findFirst: vi.fn() },
			careRemindersTable: { findFirst: vi.fn() },
			vaccinesTable: { findFirst: vi.fn() },
			medicalRecordsTable: { findFirst: vi.fn() },
			prescriptionsTable: { findFirst: vi.fn() },
			clinicalDocumentsTable: { findFirst: vi.fn() },
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
		txUpdateReturning,
		txUpdateSet,
		txUpdate,
		txDeleteWhere,
		txDelete,
		dbUpdateReturning,
		dbUpdateWhere,
		dbUpdateSet,
		dbUpdate,
		dbDeleteWhere,
		dbDelete,
		productItemsFindFirst: vi.fn(),
		chargeFindFirst: vi.fn(),
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
		query: {
			appointmentProductItemsTable: { findFirst: mocks.productItemsFindFirst },
			appointmentChargesTable: { findFirst: mocks.chargeFindFirst },
			careRemindersTable: { findFirst: mocks.tx.query.careRemindersTable.findFirst },
		},
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

vi.mock('@/lib/scheduling/doctor-working-hours', async (importOriginal) => ({
	...await importOriginal<typeof import('@/lib/scheduling/doctor-working-hours')>(),
	assertIntervalWithinDoctorWorkingHours: mocks.assertIntervalWithinDoctorWorkingHours,
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
	rescheduleAppointment,
	getRescheduleAvailability,
} from './appointments.actions';

const PET_ID = '11111111-1111-4111-8111-111111111111';
const DOCTOR_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_DOCTOR_ID = '66666666-6666-4666-8666-666666666666';
const SERVICE_ID_1 = '33333333-3333-4333-8333-333333333333';
const SERVICE_ID_2 = '44444444-4444-4444-8444-444444444444';
const APPOINTMENT_ID = '55555555-5555-4555-8555-555555555555';
const VACCINE_ID = '88888888-8888-4888-8888-888888888888';
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
		mocks.productItemsFindFirst.mockResolvedValue(undefined);
		mocks.chargeFindFirst.mockResolvedValue(undefined);
		mocks.tx.query.appointmentChargesTable.findFirst.mockResolvedValue(undefined);
		mocks.tx.query.appointmentProductItemsTable.findFirst.mockResolvedValue(undefined);
		mocks.tx.query.careRemindersTable.findFirst.mockResolvedValue(undefined);
		mocks.tx.query.vaccinesTable.findFirst.mockResolvedValue(undefined);
		mocks.tx.query.medicalRecordsTable.findFirst.mockResolvedValue(undefined);
		mocks.tx.query.prescriptionsTable.findFirst.mockResolvedValue(undefined);
		mocks.tx.query.clinicalDocumentsTable.findFirst.mockResolvedValue(undefined);
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
		mocks.txUpdateReturning.mockResolvedValue([{ id: APPOINTMENT_ID }]);
		mocks.txUpdateWhere.mockReturnValue({ returning: mocks.txUpdateReturning });
		mocks.txUpdateSet.mockReturnValue({ where: mocks.txUpdateWhere });
		mocks.txUpdate.mockReturnValue({ set: mocks.txUpdateSet });
		mocks.txDelete.mockReturnValue({ where: mocks.txDeleteWhere });

		mocks.dbUpdateReturning.mockResolvedValue([{ id: APPOINTMENT_ID }]);
		mocks.dbUpdateWhere.mockReturnValue({ returning: mocks.dbUpdateReturning });
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

	describe('rescheduleAppointment', () => {
		const target = new Date('2026-11-25T23:00:00.000Z');
		const original = {
			id: APPOINTMENT_ID, petId: PET_ID, doctorId: DOCTOR_ID,
			status: 'confirmed', isPaid: false, totalPriceInCents: 23000,
			scheduledAt: SCHEDULED_AT, endsAt: new Date('2026-09-28T13:30:00.000Z'),
			items: [{ service: { durationMinutes: 30 } }, { service: { durationMinutes: 20 } }, { service: { durationMinutes: 15 } }],
		};
		beforeEach(() => {
			mocks.requireAuthContext.mockResolvedValue(adminContext);
			mocks.requireAccessibleAppointment.mockResolvedValue({ id: APPOINTMENT_ID, status: 'confirmed' });
			mocks.tx.query.appointmentsTable.findFirst.mockResolvedValue(original);
			mocks.tx.query.appointmentsTable.findMany.mockResolvedValue([]);
			mocks.tx.query.shiftsTable.findMany.mockResolvedValue([]);
			mocks.tx.query.calendarEventsTable.findMany.mockResolvedValue([]);
		});
		it('reagenda retorno confirmado com serviços adicionais sem regravar itens nem valores', async () => {
			await expect(rescheduleAppointment({ id: APPOINTMENT_ID, scheduledAt: target })).resolves.toEqual({ success: true });
			expect(mocks.txUpdateSet).toHaveBeenCalledExactlyOnceWith({ scheduledAt: target, endsAt: new Date('2026-11-26T00:05:00.000Z'), updatedAt: expect.any(Date) });
			expect(mocks.txDelete).not.toHaveBeenCalled();
			expect(mocks.txInsert).not.toHaveBeenCalled();
			expect(mocks.tx.query.careRemindersTable.findFirst).not.toHaveBeenCalled();
			expect(mocks.revalidatePath).toHaveBeenCalledWith('/agenda');
		});
		it('aceita agendamento pendente e preserva a reserva de um atendimento sem serviços', async () => {
			mocks.tx.query.appointmentsTable.findFirst.mockResolvedValue({ ...original, status: 'pending', items: [] });
			await rescheduleAppointment({ id: APPOINTMENT_ID, scheduledAt: target });
			expect(mocks.txUpdateSet).toHaveBeenCalledWith({ scheduledAt: target, endsAt: new Date('2026-11-25T23:30:00.000Z'), updatedAt: expect.any(Date) });
		});
		it.each(['completed', 'cancelled', 'in_progress', 'no_show'])('bloqueia atendimento %s', async (status) => {
			mocks.tx.query.appointmentsTable.findFirst.mockResolvedValue({ ...original, status });
			await expect(rescheduleAppointment({ id: APPOINTMENT_ID, scheduledAt: target })).rejects.toThrow('O status atual');
			expect(mocks.txUpdate).not.toHaveBeenCalled();
		});
		it('consulta horários usando a mesma duração do reagendamento e exclui conflitos', async () => {
			mocks.tx.query.calendarEventsTable.findMany.mockResolvedValue([{ startTime: target, endTime: new Date('2026-11-25T23:30:00.000Z') }]);
			const result = await getRescheduleAvailability({ id: APPOINTMENT_ID, dayStart: new Date('2026-11-25T04:00:00Z'), dayEnd: new Date('2026-11-26T03:59:59Z') });
			expect(result).toMatchObject({ durationMinutes: 65 });
			expect(result).toMatchObject({ availableStarts: expect.arrayContaining(['2026-11-25T23:30:00.000Z']) });
			expect(result).not.toMatchObject({ availableStarts: expect.arrayContaining([target.toISOString()]) });
			expect(mocks.txUpdate).not.toHaveBeenCalled();
		});
		it('bloqueia acesso a outro atendimento antes de iniciar a transação', async () => {
			mocks.requireAccessibleAppointment.mockRejectedValue(new Error('Agendamento não encontrado'));
			await expect(rescheduleAppointment({ id: APPOINTMENT_ID, scheduledAt: target })).rejects.toThrow('não encontrado');
			expect(mocks.transaction).not.toHaveBeenCalled();
		});
		it('bloqueia atendimento faturado', async () => {
			mocks.tx.query.appointmentChargesTable.findFirst.mockResolvedValue({ id: 'charge' });
			await expect(rescheduleAppointment({ id: APPOINTMENT_ID, scheduledAt: target })).rejects.toThrow('faturado');
			expect(mocks.txUpdate).not.toHaveBeenCalled();
		});
		it('nega acesso de tutor', async () => {
			mocks.requireAuthContext.mockResolvedValue(customerContext);
			mocks.requireStaff.mockImplementation(() => { throw new Error('Usuário não autorizado'); });
			await expect(rescheduleAppointment({ id: APPOINTMENT_ID, scheduledAt: target })).rejects.toThrow('não autorizado');
			expect(mocks.transaction).not.toHaveBeenCalled();
		});
		it('revalida o escopo do veterinário na transação', async () => {
			mocks.requireAuthContext.mockResolvedValue(doctorContext);
			mocks.tx.query.appointmentsTable.findFirst.mockResolvedValue({ ...original, doctorId: OTHER_DOCTOR_ID });
			await expect(rescheduleAppointment({ id: APPOINTMENT_ID, scheduledAt: target })).rejects.toThrow('permissão');
			expect(mocks.txUpdate).not.toHaveBeenCalled();
		});
		it.each(['appointments', 'shifts', 'events'])('bloqueia conflito de horário: %s', async (kind) => {
			const start = target;
			const end = new Date('2026-11-25T23:20:00.000Z');
			if (kind === 'appointments') mocks.tx.query.appointmentsTable.findMany.mockResolvedValue([{ scheduledAt: start, endsAt: end, items: [] }]);
			if (kind === 'shifts') mocks.tx.query.shiftsTable.findMany.mockResolvedValue([{ startTime: start, endTime: end }]);
			if (kind === 'events') mocks.tx.query.calendarEventsTable.findMany.mockResolvedValue([{ startTime: start, endTime: end }]);
			await expect(rescheduleAppointment({ id: APPOINTMENT_ID, scheduledAt: target })).rejects.toThrow('não está disponível');
			expect(mocks.txUpdate).not.toHaveBeenCalled();
		});
		it('bloqueia fora do horário de trabalho', async () => {
			mocks.assertIntervalWithinDoctorWorkingHours.mockImplementation(() => { throw new Error('Fora do horário'); });
			await expect(rescheduleAppointment({ id: APPOINTMENT_ID, scheduledAt: target })).rejects.toThrow('Fora do horário');
			expect(mocks.txUpdate).not.toHaveBeenCalled();
		});
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
			).rejects.toThrow('O status atual não permite editar este agendamento.');

			expect(mocks.transaction).not.toHaveBeenCalled();
		});

		it('rejects update when charge was already issued', async () => {
			mocks.chargeFindFirst.mockResolvedValue({ id: 'charge-id' });
			await expect(upsertAppointment({ ...baseInput, id: APPOINTMENT_ID }))
				.rejects.toThrow('faturado');
			expect(mocks.transaction).not.toHaveBeenCalled();
		});

		it('updates pending appointment and replaces its services', async () => {
			mocks.tx.query.appointmentsTable.findFirst.mockResolvedValueOnce({ id: APPOINTMENT_ID, status: 'pending' });
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

		it.each(['in_progress', 'completed', 'cancelled', 'no_show'] as const)(
			'rejects editing an appointment with %s status',
			async (status) => {
				mocks.requireAuthContext.mockResolvedValue(adminContext);
				mocks.requireAccessibleAppointment.mockResolvedValue({ id: APPOINTMENT_ID, status });
				await expect(upsertAppointment({ ...baseInput, id: APPOINTMENT_ID, status }))
					.rejects.toThrow('O status atual não permite editar este agendamento.');
				expect(mocks.transaction).not.toHaveBeenCalled();
			},
		);

		it('allows staff to edit a confirmed appointment without changing its status', async () => {
			mocks.requireAuthContext.mockResolvedValue(adminContext);
			mocks.requireAccessibleAppointment.mockResolvedValue({ id: APPOINTMENT_ID, status: 'confirmed' });
			mocks.tx.query.appointmentsTable.findFirst
				.mockResolvedValueOnce({ id: APPOINTMENT_ID, status: 'confirmed' });
			await upsertAppointment({ ...baseInput, id: APPOINTMENT_ID, status: 'confirmed' });
			expect(mocks.txUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ status: 'confirmed' }));
		});

		it('blocks editing when the status changes after row lock', async () => {
			mocks.requireAuthContext.mockResolvedValue(adminContext);
			mocks.requireAccessibleAppointment.mockResolvedValue({ id: APPOINTMENT_ID, status: 'pending' });
			mocks.tx.query.appointmentsTable.findFirst
				.mockResolvedValueOnce({ id: APPOINTMENT_ID, status: 'completed' });
			await expect(upsertAppointment({ ...baseInput, id: APPOINTMENT_ID, status: 'pending' }))
				.rejects.toThrow('O agendamento mudou de status');
			expect(mocks.txUpdate).not.toHaveBeenCalled();
		});

		it('blocks editing when a charge appears after row lock', async () => {
			mocks.requireAuthContext.mockResolvedValue(adminContext);
			mocks.requireAccessibleAppointment.mockResolvedValue({ id: APPOINTMENT_ID, status: 'pending' });
			mocks.tx.query.appointmentsTable.findFirst
				.mockResolvedValueOnce({ id: APPOINTMENT_ID, status: 'pending' });
			mocks.tx.query.appointmentChargesTable.findFirst.mockResolvedValue({ id: 'new-charge' });
			await expect(upsertAppointment({ ...baseInput, id: APPOINTMENT_ID, status: 'pending' }))
				.rejects.toThrow('Atendimento faturado não pode ser editado.');
			expect(mocks.txUpdate).not.toHaveBeenCalled();
		});

		it('blocks editing when products appear after row lock', async () => {
			mocks.requireAuthContext.mockResolvedValue(adminContext);
			mocks.requireAccessibleAppointment.mockResolvedValue({ id: APPOINTMENT_ID, status: 'pending' });
			mocks.tx.query.appointmentsTable.findFirst
				.mockResolvedValueOnce({ id: APPOINTMENT_ID, status: 'pending' });
			mocks.tx.query.appointmentProductItemsTable.findFirst.mockResolvedValue({ id: 'new-product' });
			await expect(upsertAppointment({ ...baseInput, id: APPOINTMENT_ID, status: 'pending' }))
				.rejects.toThrow('Este atendimento possui produtos');
			expect(mocks.txUpdate).not.toHaveBeenCalled();
		});

		it('does not allow staff to change status through the edit form', async () => {
			mocks.requireAuthContext.mockResolvedValue(adminContext);
			mocks.requireAccessibleAppointment.mockResolvedValue({ id: APPOINTMENT_ID, status: 'pending' });
			await expect(upsertAppointment({ ...baseInput, id: APPOINTMENT_ID, status: 'confirmed' }))
				.rejects.toThrow('Utilize as ações de status');
			expect(mocks.transaction).not.toHaveBeenCalled();
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

	describe('conversao de lembrete em agendamento', () => {
		const REMINDER_ID = '77777777-7777-4777-8777-777777777777';
		const convertInput = {
			...baseInput,
			status: 'pending' as const,
			services: [SERVICE_ID_1],
			sourceReminderId: REMINDER_ID,
		};

		it('vincula o retorno ao novo agendamento na mesma transacao', async () => {
			mocks.requireAuthContext.mockResolvedValue(doctorContext);
			mocks.tx.query.careRemindersTable.findFirst.mockResolvedValue({
				id: REMINDER_ID, petId: PET_ID, doctorId: DOCTOR_ID,
				type: 'vaccine', status: 'pending', appointmentId: null,
				sourceVaccineId: VACCINE_ID,
			});
			mocks.tx.query.vaccinesTable.findFirst.mockResolvedValue({
				id: VACCINE_ID, petId: PET_ID, serviceId: SERVICE_ID_1,
			});
			mocks.tx.query.servicesTable.findMany.mockResolvedValue([{...servicesData[0], isVaccine: true}]);
			await expect(upsertAppointment(convertInput)).resolves.toEqual({success: true});
			expect(mocks.requireStaff).toHaveBeenCalledWith(doctorContext);
			expect(mocks.txUpdateSet).toHaveBeenCalledWith(expect.objectContaining({appointmentId: APPOINTMENT_ID}));
		});

		it('bloqueia conversao duplicada de um lembrete ja vinculado', async () => {
			mocks.requireAuthContext.mockResolvedValue(doctorContext);
			mocks.tx.query.careRemindersTable.findFirst.mockResolvedValue({
				id: REMINDER_ID, petId: PET_ID, doctorId: DOCTOR_ID,
				type: 'vaccine', status: 'pending', appointmentId: APPOINTMENT_ID,
				sourceVaccineId: VACCINE_ID,
			});
			await expect(upsertAppointment(convertInput)).rejects.toThrow('nao esta disponivel para conversao');
			expect(mocks.txInsert).not.toHaveBeenCalled();
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
			expect(mocks.txDelete).toHaveBeenCalledTimes(1);
			expect(mocks.txDeleteWhere).toHaveBeenCalledTimes(1);
			expect(mocks.revalidatePath).toHaveBeenCalledWith('/appointments');
		});

		it('bloqueia exclusão quando há cobrança cancelada', async () => {
			mocks.requireAuthContext.mockResolvedValue(adminContext);
			mocks.tx.query.appointmentChargesTable.findFirst.mockResolvedValue({ id: 'charge-void' });
			await expect(deleteAppointment({ id: APPOINTMENT_ID })).rejects.toThrow('histórico financeiro');
			expect(mocks.txDelete).not.toHaveBeenCalled();
		});

		it('bloqueia exclusão de vacinação vinculada', async () => {
			mocks.requireAuthContext.mockResolvedValue(doctorContext);
			mocks.tx.query.vaccinesTable.findFirst.mockResolvedValue({ id: 'vaccine-1' });
			await expect(deleteAppointment({ id: APPOINTMENT_ID })).rejects.toThrow('histórico clínico');
			expect(mocks.txDelete).not.toHaveBeenCalled();
		});

		it('bloqueia exclusão de prontuário, receita e documento', async () => {
			mocks.requireAuthContext.mockResolvedValue(adminContext);
			for (const table of ['medicalRecordsTable', 'prescriptionsTable', 'clinicalDocumentsTable'] as const) {
				mocks.tx.query[table].findFirst.mockResolvedValueOnce({ id: 'linked' });
				await expect(deleteAppointment({ id: APPOINTMENT_ID })).rejects.toThrow('histórico clínico');
			}
			expect(mocks.txDelete).not.toHaveBeenCalled();
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

		it('rejects confirmation if status changes before the conditional update', async () => {
			mocks.requireAuthContext.mockResolvedValue(doctorContext);
			mocks.dbUpdateReturning.mockResolvedValue([]);

			await expect(markAsConfirmed({ id: APPOINTMENT_ID })).rejects.toThrow(
				'O agendamento foi alterado por outra operação.',
			);
			expect(mocks.dbUpdateWhere).toHaveBeenCalledTimes(1);
			expect(mocks.dbUpdateReturning).toHaveBeenCalledTimes(1);
			expect(mocks.revalidatePath).not.toHaveBeenCalled();
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
		it('returns vaccination flow only when appointment is linked to a pending reminder', async () => {
			mocks.requireAuthContext.mockResolvedValue(doctorContext);
			mocks.requireAccessibleAppointment.mockResolvedValue({ id: APPOINTMENT_ID, status: 'confirmed' });
			mocks.tx.query.careRemindersTable.findFirst.mockResolvedValue({
				id: 'reminder-id', petId: PET_ID, doctorId: DOCTOR_ID, title: 'Vacina: V10', sourceVaccine: { serviceId: SERVICE_ID_1 },
			});
			const result = await markAppointmentAsCompleted({ id: APPOINTMENT_ID });
			expect(result).toEqual({ vaccineFlow: {
				petId: PET_ID, reminderId: 'reminder-id', appointmentId: APPOINTMENT_ID, doctorId: DOCTOR_ID,
				vaccineName: 'V10', serviceId: SERVICE_ID_1,
			} });
		});

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

		it('rejects completion if status changes before the conditional update', async () => {
			mocks.requireAuthContext.mockResolvedValue(doctorContext);
			mocks.requireAccessibleAppointment.mockResolvedValue({
				id: APPOINTMENT_ID,
				status: 'confirmed',
			});
			mocks.dbUpdateReturning.mockResolvedValue([]);

			await expect(markAppointmentAsCompleted({ id: APPOINTMENT_ID })).rejects.toThrow(
				'O status do atendimento mudou.',
			);
			expect(mocks.dbUpdateWhere).toHaveBeenCalledTimes(1);
			expect(mocks.dbUpdateReturning).toHaveBeenCalledTimes(1);
			expect(mocks.revalidatePath).not.toHaveBeenCalled();
		});

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
			expect(mocks.txUpdateSet).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 'cancelled',
				}),
			);
			expect(mocks.txUpdateWhere).toHaveBeenCalledTimes(2);
			expect(mocks.revalidatePath).toHaveBeenCalledWith('/appointments');
		});

		it('rejects cancellation if status changes before the conditional update', async () => {
			mocks.txUpdateReturning.mockResolvedValue([]);

			await expect(markAppointmentAsCancelled({ id: APPOINTMENT_ID })).rejects.toThrow(
				'O agendamento foi alterado por outra operação',
			);
			expect(mocks.txUpdateWhere).toHaveBeenCalledTimes(1);
			expect(mocks.txUpdateReturning).toHaveBeenCalledTimes(1);
			expect(mocks.revalidatePath).not.toHaveBeenCalled();
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

			expect(mocks.txUpdate).not.toHaveBeenCalled();
		});
	});
});

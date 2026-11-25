import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import { appointmentsTable } from '@/db/schema';
import {
	buildAppointmentAccessCondition,
	lockAccessibleAppointment,
	type AppointmentTransaction,
} from './appointment-access';
import type { AuthContext } from './auth-context';

vi.mock('@/db', async () => {
	const { QueryBuilder } = await import('drizzle-orm/pg-core');
	return { db: new QueryBuilder() };
});

const id = '11111111-1111-4111-8111-111111111111';
const petId = '22222222-2222-4222-8222-222222222222';
const customer: AuthContext = {
	role: 'customer',
	customerId: '33333333-3333-4333-8333-333333333333',
	doctorId: null,
	userId: 'user',
	clerkUserId: 'clerk',
};
const doctor: AuthContext = { ...customer, role: 'doctor', customerId: null, doctorId: 'doctor-id' };
const admin: AuthContext = { ...customer, role: 'admin', customerId: null };
const execute = vi.fn();
const findFirst = vi.fn();
const tx = { execute, query: { appointmentsTable: { findFirst } } } as unknown as AppointmentTransaction;
const appointment = { id, petId, status: 'pending' };
const dialect = new PgDialect();

describe('escopo transacional de agendamentos', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		findFirst.mockResolvedValue(appointment);
		execute.mockResolvedValue({ rows: [{ petId }] });
	});

	it('restringe o tutor pelo vínculo com o pet do agendamento', () => {
		const query = dialect.sqlToQuery(buildAppointmentAccessCondition(customer, id)!);
		expect(query.sql).toContain('exists');
		expect(query.sql).toContain('"pet_tutors"');
		expect(query.sql).toContain('"appointments"."pet_id"');
		expect(query.params).toEqual([id, customer.customerId]);
	});

	it('restringe o veterinário pelo próprio identificador', () => {
		const query = dialect.sqlToQuery(buildAppointmentAccessCondition(doctor, id)!);
		expect(query.sql).toContain('"appointments"."doctor_id"');
		expect(query.params).toEqual([id, doctor.doctorId]);
	});

	it('preserva o escopo administrativo limitado ao ID solicitado', () => {
		const query = dialect.sqlToQuery(buildAppointmentAccessCondition(admin, id)!);
		expect(query.params).toEqual([id]);
	});

	it('revalida o escopo após bloquear o agendamento', async () => {
		await expect(lockAccessibleAppointment(tx, doctor, id)).resolves.toEqual(appointment);
		expect(execute.mock.invocationCallOrder[0]).toBeLessThan(findFirst.mock.invocationCallOrder[0]);
		const query = dialect.sqlToQuery(findFirst.mock.calls[0][0].where(appointmentsTable));
		expect(query.params).toEqual([id, doctor.doctorId]);
	});

	it('nega agendamento que mudou de titularidade antes da leitura transacional', async () => {
		findFirst.mockResolvedValue(undefined);
		await expect(lockAccessibleAppointment(tx, doctor, id)).rejects.toThrow('Agendamento não encontrado');
	});

	it('trava o vínculo do tutor e revalida após a trava', async () => {
		await expect(lockAccessibleAppointment(tx, customer, id)).resolves.toEqual(appointment);
		expect(execute).toHaveBeenCalledTimes(2);
		expect(findFirst).toHaveBeenCalledTimes(2);
		const query = dialect.sqlToQuery(execute.mock.calls[1][0]);
		expect(query.sql).toContain('FOR SHARE');
		expect(query.params).toEqual([petId, customer.customerId]);
		expect(execute.mock.invocationCallOrder[1]).toBeLessThan(findFirst.mock.invocationCallOrder[1]);
	});

	it('nega se nenhuma linha de vínculo for travada', async () => {
		execute.mockResolvedValueOnce({ rows: [{ id }] }).mockResolvedValueOnce({ rows: [] });
		await expect(lockAccessibleAppointment(tx, customer, id)).rejects.toThrow('Agendamento não encontrado');
		expect(findFirst).toHaveBeenCalledTimes(1);
	});

	it('nega se o vínculo desaparecer enquanto aguarda a trava', async () => {
		findFirst.mockResolvedValueOnce(appointment).mockResolvedValueOnce(undefined);
		await expect(lockAccessibleAppointment(tx, customer, id)).rejects.toThrow('Agendamento não encontrado');
	});
});

import { describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import { and, inArray } from 'drizzle-orm';
import { appointmentChargesTable } from '@/db/schema';
import type { AuthContext } from '@/lib/security/auth-context';
import {
	buildFinancialAccessCondition,
	buildOwnFinancialChargeAccessCondition,
	requireFinancialTutorId,
} from './financial-access';

// Usa o construtor SQL do Drizzle, sem conexão ao PostgreSQL.
vi.mock('@/db', async () => {
	const { QueryBuilder } = await import('drizzle-orm/pg-core');
	return { db: new QueryBuilder() };
});

const context = (overrides: Partial<AuthContext> = {}): AuthContext => ({
	clerkUserId: 'clerk-test',
	userId: 'user-test',
	role: 'customer',
	customerId: 'tutor-a',
	doctorId: null,
	...overrides,
});

const dialect = new PgDialect();

describe('financial access', () => {
	it('requires an authenticated customer profile for the own-finance entry point', () => {
		expect(requireFinancialTutorId(context())).toBe('tutor-a');
		expect(() => requireFinancialTutorId(context({ customerId: null }))).toThrow();
	});
	it.each(['admin', 'doctor'] as const)('rejects %s in the own-finance entry point', (role) => {
		expect(() => requireFinancialTutorId(context({ role }))).toThrow();
	});
	it.each(['tutor-a', 'tutor-b'])(
		'restricts %s by current pet linkage, independent of the named charge owner',
		(customerId) => {
			const sql = dialect.sqlToQuery(buildFinancialAccessCondition(context({ customerId }))!);
			expect(sql.sql).not.toContain('"appointment_charges"."customer_id"');
			expect(sql.sql).toContain('"pet_tutors"."customer_id"');
			expect(sql.sql).toContain('"pet_tutors"."pet_id" = "appointments"."pet_id"');
			expect(sql.sql).toContain('exists');
			expect(sql.params).toEqual([customerId]);
		},
	);
	it.each(['tutor-a', 'tutor-b', ''])('rejects staff-only holder filter %j from any tutor context', (customerId) => {
		expect(() => buildFinancialAccessCondition(context(), customerId)).toThrow();
	});
	it('keeps pet authorization even when an explicit charge ID is requested', () => {
		const condition = and(
			buildFinancialAccessCondition(context()),
			inArray(appointmentChargesTable.id, ['charge-from-another-pet']),
		);
		const sql = dialect.sqlToQuery(condition!);
		expect(sql.sql).toContain('exists');
		expect(sql.sql).toContain('"pet_tutors"."pet_id" = "appointments"."pet_id"');
		expect(sql.sql).toContain('"appointment_charges"."id" in');
		expect(sql.params).toEqual(['tutor-a', 'charge-from-another-pet']);
	});
	it('never falls back to unrestricted access for an unlinked tutor', () => {
		expect(() => buildFinancialAccessCondition(context({ customerId: null }))).toThrow();
	});
	it('keeps doctor scope and an optional customer restriction', () => {
		const sql = dialect.sqlToQuery(
			buildFinancialAccessCondition(context({ role: 'doctor', doctorId: 'doctor-a' }), 'tutor-b')!,
		);
		expect(sql.sql).toContain('"appointments"."doctor_id"');
		expect(sql.sql).toContain('"appointment_charges"."customer_id"');
		expect(sql.params).toEqual(['doctor-a', 'tutor-b']);
	});
	it('rejects a doctor without a linked profile', () => {
		expect(() => buildFinancialAccessCondition(context({ role: 'doctor' }))).toThrow();
	});
	it('keeps admin access unrestricted only when no customer filter is provided', () => {
		const admin = context({ role: 'admin' });
		expect(buildFinancialAccessCondition(admin)).toBeUndefined();
		expect(dialect.sqlToQuery(buildFinancialAccessCondition(admin, 'tutor-b')!).params).toEqual(['tutor-b']);
	});
	it('combines the requested charge ID and the current tutor scope for checkout', () => {
		const sql = dialect.sqlToQuery(buildOwnFinancialChargeAccessCondition(context(), 'charge-a')!);
		expect(sql.sql).toContain('exists');
		expect(sql.sql).toContain('"pet_tutors"."pet_id" = "appointments"."pet_id"');
		expect(sql.sql).toContain('"appointment_charges"."id" =');
		expect(sql.params).toEqual(['tutor-a', 'charge-a']);
	});
	it.each(['admin', 'doctor'] as const)('denies checkout scope for %s', (role) => {
		expect(() => buildOwnFinancialChargeAccessCondition(context({ role }), 'charge-a')).toThrow();
	});
});

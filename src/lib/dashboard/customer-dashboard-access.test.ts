import { describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { AuthContext } from '@/lib/security/auth-context';
import { buildCustomerDashboardAccess } from './customer-dashboard-access';

vi.mock('@/db', async () => {
 const { QueryBuilder } = await import('drizzle-orm/pg-core');
 return { db: new QueryBuilder() };
});
const dialect = new PgDialect();
const context: AuthContext = { role: 'customer', customerId: 'tutor-a', doctorId: null, userId: 'user-a', clerkUserId: 'clerk-a' };

describe('Customer dashboard access', () => {
 it.each(['tutor-a', 'tutor-b'])('restringe todas as consultas ao vínculo atual de %s', customerId => {
  const conditions = buildCustomerDashboardAccess({ ...context, customerId });
  for (const condition of Object.values(conditions)) {
   expect(condition).toBeDefined();
   const query = dialect.sqlToQuery(condition!);
   expect(query.sql).toContain('"pet_tutors"."customer_id"');
   expect(query.sql).toContain('"pet_id"');
   expect(query.params).toEqual([customerId]);
  }
  expect(dialect.sqlToQuery(conditions.pets!).sql).toContain('"pets"."id"');
  expect(dialect.sqlToQuery(conditions.appointments!).sql).toContain('"appointments"."pet_id"');
  expect(dialect.sqlToQuery(conditions.reminders!).sql).toContain('"care_reminders"."pet_id"');
 });
 it('não retorna condições irrestritas para conta sem tutor', () => expect(() => buildCustomerDashboardAccess({ ...context, customerId: null })).toThrow());
 it.each(['admin', 'doctor'] as const)('rejeita %s antes de construir as consultas', role => expect(() => buildCustomerDashboardAccess({ ...context, role })).toThrow());
});

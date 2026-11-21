import { describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';

vi.mock('@/db', () => ({
  db: {
    select: () => ({ from: () => ({ where: (condition: unknown) => condition }) }),
  },
}));

import { buildCareReminderAccessCondition } from './care-reminder-access';
import type { AuthContext } from './auth-context';

const base: AuthContext = {
  clerkUserId: 'clerk', userId: 'user', role: 'admin',
  doctorId: null, customerId: null,
};

describe('buildCareReminderAccessCondition', () => {
  it('permite ao administrador consultar a lista geral', () => {
    expect(buildCareReminderAccessCondition(base)).toBeUndefined();
  });

  it('limita a consulta ao veterinário autenticado', () => {
    const condition = buildCareReminderAccessCondition({
      ...base, role: 'doctor', doctorId: '22222222-2222-4222-8222-222222222222',
    });
    const query = new PgDialect().sqlToQuery(condition!);
    expect(query.sql).toContain('doctor_id');
    expect(query.params).toContain('22222222-2222-4222-8222-222222222222');
  });

  it('bloqueia veterinário sem perfil', () => {
    expect(() => buildCareReminderAccessCondition({ ...base, role: 'doctor' }))
      .toThrow('Perfil de veterinário não encontrado');
  });

  it('bloqueia tutor sem perfil', () => {
    expect(() => buildCareReminderAccessCondition({ ...base, role: 'customer' }))
      .toThrow('Perfil de cliente não encontrado');
  });

  it('exige associação do tutor com o pet', () => {
    const condition = buildCareReminderAccessCondition({
      ...base, role: 'customer', customerId: '33333333-3333-4333-8333-333333333333',
    });
    const query = new PgDialect().sqlToQuery(condition!);
    expect(query.sql.toLowerCase()).toContain('exists');
    expect(query.sql).toContain('pet_tutors');
    expect(query.sql).toContain('customer_id');
    expect(query.params).toContain('33333333-3333-4333-8333-333333333333');
  });
});

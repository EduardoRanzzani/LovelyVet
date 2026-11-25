import { describe, expect, it } from 'vitest';
import type { AuthContext } from '@/lib/security/auth-context';
import { chargeCountLabel, getCustomerDashboardWindow, getPetAgeLabel, petCountLabel, requireCustomerDashboardScope } from './customer-dashboard';

const context: AuthContext = { role: 'customer', customerId: 'tutor-a', doctorId: null, userId: 'user-a', clerkUserId: 'clerk-a' };
describe('Dashboard Customer', () => {
 it('deriva a identidade do tutor autenticado', () => expect(requireCustomerDashboardScope(context)).toBe('tutor-a'));
 it.each(['admin', 'doctor'] as const)('rejeita o perfil %s', role => expect(() => requireCustomerDashboardScope({ ...context, role })).toThrow());
 it('rejeita conta sem cadastro de tutor', () => expect(() => requireCustomerDashboardScope({ ...context, customerId: null })).toThrow());
 it('calcula a data local e o mês de referência na virada UTC', () => {
  const window = getCustomerDashboardWindow(new Date('2026-12-01T02:00:00Z'));
  expect(window.today).toBe('2026-11-30');
  expect(window.month).toBe('2026-11');
  expect(window.end.toISOString()).toBe('2026-12-30T04:00:00.000Z');
 });
 it.each([[0, '0 pets vinculados', '0 cobranças em aberto'], [1, '1 pet vinculado', '1 cobrança em aberto'], [14, '14 pets vinculados', '14 cobranças em aberto']] as const)('pluraliza %s corretamente', (count, pets, charges) => {
  expect(petCountLabel(count)).toBe(pets);
  expect(chargeCountLabel(count)).toBe(charges);
 });
 it.each([['2025-11-24', '1 ano'], ['2024-11-24', '2 anos'], ['2026-10-24', '1 mês'], ['2026-09-24', '2 meses'], ['2026-11-24', 'Menos de 1 mês'], ['2026-11-25', 'Idade não informada'], ['2025-11-25', '11 meses']])('apresenta idade de %s', (birth, label) => expect(getPetAgeLabel(birth, '2026-11-24')).toBe(label));
});

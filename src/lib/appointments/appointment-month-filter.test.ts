import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const page = read('src/app/(protected)/appointments/page.tsx');
const list = read('src/app/(protected)/appointments/_components/appointments-list.tsx');
const appointments = read('src/api/actions/appointments.actions.ts');
const reminders = read('src/api/actions/clinical-reminders.actions.ts');

describe('filtro mensal de agendamentos e retornos', () => {
  it('usa o mesmo mês para as duas listas e seus totais', () => {
    expect(page).toContain('MAX_PAGE_SIZE, keyword, month)');
    expect(appointments).toContain('gte(appointments.scheduledAt, start)');
    expect(appointments).toContain('lt(appointments.scheduledAt, end)');
    expect(appointments).toContain('monthCondition,');
    expect(reminders).toContain('gte(reminder.dueDate, monthStart)');
    expect(reminders).toContain('lt(reminder.dueDate, monthEnd)');
    expect(reminders).toContain('gte(careRemindersTable.dueDate, monthStart)');
    expect(reminders).toContain('lt(careRemindersTable.dueDate, monthEnd)');
  });
  it('reutiliza navegador mensal e reinicia as duas paginações', () => {
    expect(list).toContain('<MonthNavigator month={month}');
    expect(list).toContain("next.delete('appointmentsPage')");
    expect(list).toContain("next.delete('remindersPage')");
    expect(list).toContain("next.set('month', nextMonth)");
  });
  it('distribui os botões de retorno em duas metades no mobile', () => {
    expect(list).toContain("className='flex w-full items-center gap-2'");
    expect(list).toContain('flex-1 gap-1.5 whitespace-nowrap lg:h-8 lg:flex-none');
  });
});

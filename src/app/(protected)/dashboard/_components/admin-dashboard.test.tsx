import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AdminDashboard from './admin-dashboard';
import type { ComponentProps } from 'react';

vi.mock('../../finance/_components/finance-month-filter', () => ({
 FinanceMonthFilter: () => <div>Mês de referência</div>,
}));

const data: ComponentProps<typeof AdminDashboard>['data'] = {
 month: '2026-11',
 finance: { billedInCents: 20000, receivedInCents: 0, outstandingInCents: 20000, invoicedCount: 1 },
 appointments: { total: 1, completed: 1, pending: 0, confirmed: 0, inProgress: 0, cancelled: 0, noShow: 0 },
 registrations: { pets: 1, newPets: 0, customers: 1, newCustomers: 0, doctors: 1 },
 pending: { confirmations: 0, reminders: 0, charges: 1 },
 shifts: { count: 1, total: 10000, paid: 0, unpaid: 10000, unpaidCount: 1, missingAmount: 0, clinics: [] },
 trend: [],
};

describe('AdminDashboard', () => {
 it('prioritizes shift finances before appointment finances and operational metrics', () => {
  render(<AdminDashboard data={data} />);
  const shifts = screen.getByRole('region', { name: 'Plantões' });
  const finance = screen.getByRole('region', { name: 'Financeiro dos atendimentos' });
  const operation = screen.getByRole('region', { name: 'Indicadores operacionais' });
  expect(shifts.compareDocumentPosition(finance) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(finance.compareDocumentPosition(operation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 });
 it('keeps a single privacy toggle at the top and applies it to both financial sections', () => {
  render(<AdminDashboard data={data} />);
  const shifts = screen.getByRole('region', { name: 'Plantões' });
  const finance = screen.getByRole('region', { name: 'Financeiro dos atendimentos' });
  expect(within(shifts).getAllByText('••••')).toHaveLength(3);
  expect(within(finance).getAllByText('••••')).toHaveLength(3);
  fireEvent.click(within(shifts).getByRole('button', { name: 'Mostrar valores' }));
  expect(within(shifts).queryByText('••••')).not.toBeInTheDocument();
  expect(within(finance).queryByText('••••')).not.toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Ocultar valores' })).toHaveLength(1);
 });
 it.each([
  [0, '0 plantões', '0 novos no mês'],
  [1, '1 plantão', '1 novo no mês'],
  [14, '14 plantões', '14 novos no mês'],
 ] as const)('uses correct Portuguese plurals for %i', (count, shiftLabel, newLabel) => {
  const totals = { count, total: count * 10000, paid: 0, unpaid: count * 10000, unpaidCount: count, missingAmount: 0 };
  render(<AdminDashboard data={{
   ...data,
   registrations: { ...data.registrations, newPets: count, newCustomers: count },
   shifts: { ...totals, clinics: count === 0 ? [] : [{ ...totals, name: 'Clínica A', requesters: [{ ...totals, name: 'Solicitante A' }] }] },
  }} />);
  const shifts = screen.getByRole('region', { name: 'Plantões' });
  expect(within(shifts).getByText(shiftLabel)).toBeInTheDocument();
  expect(screen.getAllByText(newLabel)).toHaveLength(2);
  if (count > 0) {
   fireEvent.click(within(shifts).getByText(`Clínica A · ${shiftLabel}`));
   expect(within(shifts).getByText(`Solicitante A · ${shiftLabel}`)).toBeInTheDocument();
  }
  expect(within(shifts).queryByText(/plantão\(ões\)/)).not.toBeInTheDocument();
 });
});

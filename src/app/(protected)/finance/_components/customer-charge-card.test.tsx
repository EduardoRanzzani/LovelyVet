import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CustomerChargeCard } from './customer-charge-card';
import type { FinancialStatementRow } from '@/lib/finance/financial-report';
import type { StatementItem } from '@/lib/finance/customer-statement';

const charge: FinancialStatementRow = {
 id: 'a', customerId: 'c', appointmentId: 'ap', petName: 'Pet de teste', status: 'open',
 createdAt: new Date('2026-10-10T12:00:00Z'), totalInCents: 9500, paidInCents: 4000,
 balanceInCents: 5500, financialStatus: 'partial', payments: [
  { id: 'p1', chargeId: 'a', amountInCents: 1000, method: 'cash', receivedAt: new Date('2026-10-12T12:00:00Z') },
  { id: 'p2', chargeId: 'a', amountInCents: 3000, method: 'pix', receivedAt: new Date('2026-11-02T12:00:00Z') },
 ],
};
const items: StatementItem[] = [
 { chargeId: 'a', id: 's', name: 'Consulta', kind: 'service', quantity: 1, unitPriceInCents: 6000, discountInCents: 0 },
 { chargeId: 'a', id: 'p', name: 'Produto teste', kind: 'product', quantity: 2, unitPriceInCents: 2000, discountInCents: 500 },
];

describe('CustomerChargeCard', () => {
 it('shows historical items, quantity, line discount and net line total', () => {
  render(<CustomerChargeCard charge={charge} items={items} month='2026-11' />);
  expect(screen.getByText('Consulta')).toBeInTheDocument();
  expect(screen.getByText('Produto teste')).toBeInTheDocument();
  expect(screen.getByText(/Produto · 2 × R\$\s*20,00/)).toBeInTheDocument();
  expect(screen.getByText(/Desconto: R\$\s*5,00/)).toBeInTheDocument();
  expect(screen.getByText(/R\$\s*35,00/)).toBeInTheDocument();
 });
 it('shows current balance, status and payments from both months', () => {
  render(<CustomerChargeCard charge={charge} items={items} month='2026-11' />);
  expect(screen.getByText('Parcialmente paga')).toBeInTheDocument();
  expect(screen.getByText(/R\$\s*55,00/)).toBeInTheDocument();
  expect(screen.getByText('Pix')).toBeInTheDocument();
  expect(screen.getByText('Dinheiro')).toBeInTheDocument();
  expect(screen.getByText('No mês selecionado')).toBeInTheDocument();
  expect(screen.getByText('Fora do mês selecionado')).toBeInTheDocument();
 });
 it('keeps cancellation visible and handles missing items and payments', () => {
  render(<CustomerChargeCard charge={{ ...charge, status: 'void', financialStatus: 'void', paidInCents: 0, balanceInCents: 0, payments: [] }} items={[]} month='2026-11' />);
  const card = screen.getByRole('article');
  expect(within(card).getByText('Cancelada')).toBeInTheDocument();
  expect(within(card).getByText('Não há itens disponíveis para exibição.')).toBeInTheDocument();
  expect(within(card).getByText('Nenhum pagamento registrado.')).toBeInTheDocument();
 });
});

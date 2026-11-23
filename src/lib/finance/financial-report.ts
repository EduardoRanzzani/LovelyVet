import { calculateChargeBalance } from '@/lib/finance/ledger';

export type FinancialCharge = {
 id: string; customerId: string; appointmentId: string; petName: string;
 totalInCents: number; status: string; createdAt: Date;
};
export type FinancialPayment = {
 id: string; chargeId: string; amountInCents: number; method: string; receivedAt: Date;
};
export type FinancialStatementRow = FinancialCharge & {
 paidInCents: number; balanceInCents: number;
 financialStatus: 'pending' | 'partial' | 'paid' | 'void';
 payments: FinancialPayment[];
};

export function getMonthBounds(month: string) {
 if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Mês inválido. Use AAAA-MM.');
 const [year, number] = month.split('-').map(Number);
 if (year < 2000 || year > 2100) throw new Error('Ano fora do intervalo permitido');
 // O período financeiro usa America/Campo_Grande (UTC-4), com limites inclusivo/exclusivo.
 const start = new Date(Date.UTC(year, number - 1, 1, 4));
 const end = new Date(Date.UTC(year, number, 1, 4));
 if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) throw new Error('Mês inválido');
 return { start, end };
}

export function buildFinancialReport(charges: readonly FinancialCharge[], payments: readonly FinancialPayment[], start: Date, end: Date) {
 const paymentsByCharge = new Map<string, FinancialPayment[]>();
 for (const payment of payments) {
  const entries = paymentsByCharge.get(payment.chargeId) ?? [];
  entries.push(payment);
  paymentsByCharge.set(payment.chargeId, entries);
 }
 const statements: FinancialStatementRow[] = charges.map((charge) => {
  const entries = (paymentsByCharge.get(charge.id) ?? []).slice().sort((a,b) => a.receivedAt.getTime() - b.receivedAt.getTime());
  const balance = calculateChargeBalance(charge.totalInCents, entries, charge.status === 'void');
  return { ...charge, ...{paidInCents: balance.paidInCents, balanceInCents: balance.status === 'void' ? 0 : balance.balanceInCents, financialStatus: balance.status}, payments: entries };
 });
 const currentCharges = statements.filter((charge) => charge.createdAt >= start && charge.createdAt < end && charge.financialStatus !== 'void');
 const received = statements.flatMap((charge) => charge.payments).filter((payment) => payment.receivedAt >= start && payment.receivedAt < end);
 return {
  billedInCents: currentCharges.reduce((sum, charge) => sum + charge.totalInCents, 0),
  receivedInCents: received.reduce((sum, payment) => sum + payment.amountInCents, 0),
  outstandingInCents: statements.reduce((sum, charge) => sum + charge.balanceInCents, 0),
  invoicedCount: currentCharges.length,
  outstandingCount: statements.filter((charge) => charge.balanceInCents > 0).length,
  statements,
 };
}

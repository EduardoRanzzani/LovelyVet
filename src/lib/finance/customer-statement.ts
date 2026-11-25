import { getMonthBounds, type FinancialStatementRow } from './financial-report';

export type StatementScope = 'month' | 'all';
export type StatementItem = {
 chargeId: string;
 id: string;
 kind: 'service' | 'product';
 name: string;
 quantity: number;
 unitPriceInCents: number;
 discountInCents: number;
};

export function resolveStatementMonth(month: unknown, now = new Date()): string {
 if (typeof month === 'string') {
  try { getMonthBounds(month); return month; } catch { /* usa o mês atual */ }
 }
 const parts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Campo_Grande', year: 'numeric', month: '2-digit',
 }).formatToParts(now);
 return `${parts.find(part => part.type === 'year')?.value}-${parts.find(part => part.type === 'month')?.value}`;
}

export function selectStatementCharges(rows: readonly FinancialStatementRow[], month: string, scope: StatementScope) {
 const { start, end } = getMonthBounds(month);
 const inMonth = (date: Date) => date >= start && date < end;
 return rows.filter(row => scope === 'all' || inMonth(row.createdAt) || row.payments.some(payment => inMonth(payment.receivedAt)))
  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function groupStatementItems(items: readonly StatementItem[]) {
 const grouped = new Map<string, StatementItem[]>();
 for (const item of items) {
  const rows = grouped.get(item.chargeId) ?? [];
  rows.push(item);
  grouped.set(item.chargeId, rows);
 }
 for (const rows of grouped.values()) {
  rows.sort((a, b) => a.kind === b.kind ? a.name.localeCompare(b.name, 'pt-BR') : a.kind === 'service' ? -1 : 1);
 }
 return grouped;
}

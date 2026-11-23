import { describe, it, expect } from 'vitest';
import { buildFinancialReport, getMonthBounds, type FinancialCharge, type FinancialPayment } from './financial-report';
const charge = (overrides: Partial<FinancialCharge> = {}): FinancialCharge => ({
 id: 'a', customerId: 'c', appointmentId: 'ap', petName: 'Margot', totalInCents: 12000,
 status: 'open', createdAt: new Date('2026-11-10T12:00:00Z'), ...overrides,
});
const payment = (overrides: Partial<FinancialPayment> = {}): FinancialPayment => ({
 id: 'p', chargeId: 'a', amountInCents: 4000, method: 'pix', receivedAt: new Date('2026-11-15T12:00:00Z'), ...overrides,
});
describe('financial report', () => {
 const bounds = getMonthBounds('2026-11');
 it('applies Campo Grande local monthly boundaries', () => {
  expect(bounds.start.toISOString()).toBe('2026-11-01T04:00:00.000Z');
  expect(bounds.end.toISOString()).toBe('2026-12-01T04:00:00.000Z');
 });
 it('rejects invalid periods', () => {
  expect(() => getMonthBounds('2026-13')).toThrow();
  expect(() => getMonthBounds('2026-1')).toThrow();
 });
 it('separates billed and received periods while keeping overall outstanding', () => {
  const data = buildFinancialReport([charge()], [payment({receivedAt: new Date('2026-12-01T05:00:00Z')})], bounds.start, bounds.end);
  expect(data.billedInCents).toBe(12000);
  expect(data.receivedInCents).toBe(0);
  expect(data.outstandingInCents).toBe(8000);
  expect(data.statements[0].financialStatus).toBe('partial');
 });
 it('excludes void charges from billed and outstanding', () => {
  const data = buildFinancialReport([charge({status:'void'})], [], bounds.start, bounds.end);
  expect(data.billedInCents).toBe(0);
  expect(data.outstandingInCents).toBe(0);
 });
 it('does not count paid bills as outstanding', () => {
  const data = buildFinancialReport([charge()], [payment({amountInCents: 12000})], bounds.start, bounds.end);
  expect(data.receivedInCents).toBe(12000);
  expect(data.outstandingInCents).toBe(0);
  expect(data.statements[0].financialStatus).toBe('paid');
 });
 it('counts payments received this month from charges billed in another month', () => {
  const data = buildFinancialReport([charge({createdAt: new Date('2026-10-10T12:00:00Z')})], [payment()], bounds.start, bounds.end);
  expect(data.billedInCents).toBe(0);
  expect(data.receivedInCents).toBe(4000);
 });
 it('fails on inconsistent overpayments', () => {
  expect(() => buildFinancialReport([charge()], [payment({amountInCents: 13000})], bounds.start, bounds.end)).toThrow();
 });
});

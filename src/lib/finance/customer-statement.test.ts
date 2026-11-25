import { describe, expect, it } from 'vitest';
import { buildFinancialReport, getMonthBounds, type FinancialCharge } from './financial-report';
import {
	groupStatementItems,
	resolveStatementMonth,
	selectStatementCharges,
	type StatementItem,
} from './customer-statement';

const month = '2026-11';
const bounds = getMonthBounds(month);
const charge = (id: string, createdAt: Date, status = 'open'): FinancialCharge => ({
	id,
	createdAt,
	status,
	customerId: 'tutor',
	appointmentId: id,
	petName: 'Pet',
	totalInCents: 10000,
});
const old = new Date('2026-10-20T12:00:00Z');
const report = buildFinancialReport(
	[
		charge('old-unpaid', old),
		charge('old-paid-in-month', old),
		charge('current', bounds.start),
		charge('cancelled', bounds.start, 'void'),
		charge('next', bounds.end),
		charge('old-paid-at-end', old),
	],
	[
		{ id: 'p1', chargeId: 'old-paid-in-month', amountInCents: 3000, method: 'pix', receivedAt: bounds.start },
		{ id: 'p2', chargeId: 'old-paid-at-end', amountInCents: 10000, method: 'pix', receivedAt: bounds.end },
	],
	bounds.start,
	bounds.end,
);

describe('customer statement', () => {
	it('includes charges issued or paid in the month, including cancelled charges', () => {
		expect(selectStatementCharges(report.statements, month, 'month').map((row) => row.id)).toEqual([
			'current',
			'cancelled',
			'old-paid-in-month',
		]);
	});
	it('preserves the full history and current balances without mutating the report', () => {
		const all = selectStatementCharges(report.statements, month, 'all');
		expect(all).toHaveLength(6);
		expect(all[0].id).toBe('next');
		expect(report.statements[0].id).toBe('old-unpaid');
		expect(all.find((row) => row.id === 'old-paid-in-month')?.balanceInCents).toBe(7000);
		expect(report.receivedInCents).toBe(3000);
	});
	it('returns an empty month without dropping the global history', () => {
		expect(selectStatementCharges(report.statements, '2026-09', 'month')).toEqual([]);
		expect(selectStatementCharges(report.statements, '2026-09', 'all')).toHaveLength(6);
	});
	it('rejects malformed or out-of-range months with a Campo Grande fallback', () => {
		const now = new Date('2026-12-01T02:00:00Z');
		for (const value of [undefined, '2026-13', '0000-01', '2101-01', ['2026-11']])
			expect(resolveStatementMonth(value, now)).toBe(month);
		expect(resolveStatementMonth('2025-02', now)).toBe('2025-02');
	});
	it('groups item rows by charge and keeps service/product prices and discounts', () => {
		const item: StatementItem = {
			chargeId: 'a',
			id: '1',
			kind: 'product',
			name: 'Produto',
			quantity: 2,
			unitPriceInCents: 500,
			discountInCents: 100,
		};
		const service: StatementItem = { ...item, kind: 'service', name: 'Consulta' };
		const another = { ...item, chargeId: 'b' };
		const result = groupStatementItems([item, another, service]);
		expect(result.get('a')).toEqual([service, item]);
		expect(result.get('b')).toEqual([another]);
		expect(result.get('unknown')).toBeUndefined();
	});
});

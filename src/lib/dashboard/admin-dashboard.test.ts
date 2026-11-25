import { describe, expect, it } from 'vitest';
import { buildFinancialReport, getMonthBounds, type FinancialCharge } from '@/lib/finance/financial-report';
import {
	buildDashboardTrend,
	getDashboardMonths,
	resolveAdminMonth,
	summarizeAdminShifts,
	summarizeAppointments,
} from './admin-dashboard';

describe('admin dashboard', () => {
	it('uses Campo Grande when the URL has no valid month', () => {
		const now = new Date('2026-12-01T02:00:00Z');
		expect(resolveAdminMonth(undefined, now)).toBe('2026-11');
		expect(resolveAdminMonth('2026-13', now)).toBe('2026-11');
		expect(resolveAdminMonth(['2026-01'], now)).toBe('2026-11');
		expect(resolveAdminMonth('2025-01', now)).toBe('2025-01');
	});
	it('preserves year across six months and respects supported bounds', () => {
		expect(getDashboardMonths('2026-02')).toEqual([
			'2025-09',
			'2025-10',
			'2025-11',
			'2025-12',
			'2026-01',
			'2026-02',
		]);
		expect(getDashboardMonths('2000-01')).toEqual(['2000-01']);
	});
	it('counts statuses by scheduled month and excludes next month boundary', () => {
		const rows = [
			{ scheduledAt: new Date('2026-11-01T03:59:59Z'), status: 'completed' },
			{ scheduledAt: new Date('2026-11-01T04:00:00Z'), status: 'completed' },
			{ scheduledAt: new Date('2026-11-15T12:00:00Z'), status: 'cancelled' },
			{ scheduledAt: new Date('2026-11-16T12:00:00Z'), status: 'no_show' },
			{ scheduledAt: new Date('2026-12-01T04:00:00Z'), status: 'pending' },
		];
		expect(summarizeAppointments(rows, '2026-11')).toEqual({
			total: 3,
			completed: 1,
			pending: 0,
			confirmed: 0,
			inProgress: 0,
			cancelled: 1,
			noShow: 1,
		});
	});
	it('keeps historical billed and received separate and excludes void charges', () => {
		const charge: FinancialCharge = {
			id: 'a',
			customerId: 'c',
			appointmentId: 'ap',
			petName: 'Teste',
			totalInCents: 20000,
			status: 'open',
			createdAt: new Date('2026-10-10T12:00:00Z'),
		};
		const report = buildFinancialReport(
			[charge, { ...charge, id: 'b', status: 'void' }],
			[
				{
					id: 'p',
					chargeId: 'a',
					amountInCents: 5000,
					method: 'pix',
					receivedAt: new Date('2026-11-10T12:00:00Z'),
				},
			],
			getMonthBounds('2026-11').start,
			getMonthBounds('2026-11').end,
		);
		expect(buildDashboardTrend(['2026-10', '2026-11'], [], report.statements)).toEqual([
			{ month: '2026-10', completed: 0, billed: 20000, received: 0 },
			{ month: '2026-11', completed: 0, billed: 0, received: 5000 },
		]);
	});
	it('returns empty trends without errors', () => {
		expect(buildDashboardTrend(['2026-11'], [], [])).toEqual([
			{ month: '2026-11', completed: 0, billed: 0, received: 0 },
		]);
	});
	it('groups shifts separately and preserves unpaid and unknown values', () => {
		const summary = summarizeAdminShifts([
			{ clinicName: 'A', requesterName: null, amountInCents: 10000, isPaid: true },
			{ clinicName: 'A', requesterName: ' R ', amountInCents: 20000, isPaid: false },
			{ clinicName: 'B', requesterName: null, amountInCents: null, isPaid: false },
		]);
		expect(summary).toMatchObject({
			count: 3,
			total: 30000,
			paid: 10000,
			unpaid: 20000,
			unpaidCount: 2,
			missingAmount: 1,
		});
		expect(summary.clinics[0]).toMatchObject({ name: 'A', count: 2, unpaid: 20000 });
		expect(summary.clinics[0].requesters.map((row) => row.name)).toEqual(['Escala fixa', 'R']);
	});
});

import { describe, expect, it } from 'vitest';
import { getDoctorShiftSummary } from './doctor-shift-summary';

const NOW = new Date('2026-11-20T12:00:00');

const shifts = [
	{
		id: 'completed-paid',
		startTime: new Date('2026-11-18T08:00:00'),
		endTime: new Date('2026-11-18T20:00:00'),
		amountInCents: 30000,
		isPaid: true,
	},
	{
		id: 'completed-unpaid',
		startTime: new Date('2026-11-19T08:00:00'),
		endTime: new Date('2026-11-19T20:00:00'),
		amountInCents: 40000,
		isPaid: false,
	},
	{
		id: 'future-unpaid',
		startTime: new Date('2026-11-25T19:00:00'),
		endTime: new Date('2026-11-26T07:30:00'),
		amountInCents: 35000,
		isPaid: false,
	},
	{
		id: 'future-paid',
		startTime: new Date('2026-11-27T19:00:00'),
		endTime: new Date('2026-11-28T07:30:00'),
		amountInCents: 25000,
		isPaid: true,
	},
];

describe('getDoctorShiftSummary', () => {
	it('conta plantões realizados e futuros', () => {
		const summary = getDoctorShiftSummary(shifts, NOW);

		expect(summary.total).toBe(4);
		expect(summary.completedCount).toBe(2);
		expect(summary.upcomingCount).toBe(2);
	});

	it('calcula valores recebidos de plantões realizados', () => {
		const summary = getDoctorShiftSummary(shifts, NOW);

		expect(summary.receivedInCents).toBe(30000);
	});

	it('calcula valores a receber sem incluir plantões futuros', () => {
		const summary = getDoctorShiftSummary(shifts, NOW);

		expect(summary.receivableInCents).toBe(40000);
	});

	it('calcula a previsão financeira dos próximos plantões', () => {
		const summary = getDoctorShiftSummary(shifts, NOW);

		expect(summary.forecastInCents).toBe(60000);
		expect(summary.prepaidInCents).toBe(25000);
	});

	it('ordena os próximos plantões pela data de início', () => {
		const summary = getDoctorShiftSummary([...shifts].reverse(), NOW);

		expect(summary.upcomingShifts.map((shift) => shift.id)).toEqual(['future-unpaid', 'future-paid']);
	});

	it('não considera plantão em andamento como realizado', () => {
		const summary = getDoctorShiftSummary(
			[
				{
					id: 'ongoing',
					startTime: new Date('2026-11-20T08:00:00'),
					endTime: new Date('2026-11-20T20:00:00'),
					amountInCents: 30000,
					isPaid: false,
				},
			],
			NOW,
		);

		expect(summary.inProgressCount).toBe(1);
		expect(summary.completedCount).toBe(0);
		expect(summary.receivableInCents).toBe(0);
	});

	it('identifica plantões sem valor financeiro cadastrado', () => {
		const summary = getDoctorShiftSummary(
			[
				{
					id: 'no-value',
					startTime: new Date('2026-11-18T08:00:00'),
					endTime: new Date('2026-11-18T20:00:00'),
					amountInCents: null,
					isPaid: false,
				},
			],
			NOW,
		);

		expect(summary.missingAmountCount).toBe(1);
	});
});

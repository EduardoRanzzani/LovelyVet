import type { ShiftsWithRelations } from '@/api/schema/shifts.schema';

type ShiftInput = Pick<ShiftsWithRelations, 'id' | 'startTime' | 'endTime' | 'amountInCents' | 'isPaid'> & {
	clinicName?: string | null;
};

export const getDoctorShiftSummary = (shifts: ShiftInput[], now: Date = new Date()) => {
	const completed = shifts.filter((shift) => new Date(shift.endTime) <= now);

	const upcoming = shifts.filter((shift) => new Date(shift.startTime) > now);

	const inProgress = shifts.filter((shift) => new Date(shift.startTime) <= now && new Date(shift.endTime) > now);

	const sumAmounts = (items: ShiftInput[]) => items.reduce((total, shift) => total + (shift.amountInCents ?? 0), 0);

	const received = completed.filter((shift) => shift.isPaid);

	const receivable = completed.filter((shift) => !shift.isPaid);

	const prepaid = [...upcoming, ...inProgress].filter((shift) => shift.isPaid);

	return {
		total: shifts.length,
		completedCount: completed.length,
		upcomingCount: upcoming.length,
		inProgressCount: inProgress.length,
		receivedInCents: sumAmounts(received),
		receivableInCents: sumAmounts(receivable),
		forecastInCents: sumAmounts(upcoming),
		prepaidInCents: sumAmounts(prepaid),
		missingAmountCount: shifts.filter((shift) => shift.amountInCents === null).length,
		upcomingShifts: [...upcoming].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
	};
};

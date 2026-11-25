import { describe, expect, it } from 'vitest';
import { canOfferOnlinePayment, isActivePaymentStatus, paymentStatusMessage } from './online-payment-view';

describe('online payment view', () => {
	it('offers a completed open charge with positive balance', () => {
		expect(canOfferOnlinePayment({ status: 'open', balanceInCents: 20000 }, 'completed')).toBe(true);
	});
	it.each([
		['void', 20000, 'completed'],
		['open', 0, 'completed'],
		['open', 20000, 'scheduled'],
	] as const)('rejects ineligible charges', (status, balanceInCents, appointmentStatus) => {
		expect(canOfferOnlinePayment({ status, balanceInCents }, appointmentStatus)).toBe(false);
	});
	it.each(['created', 'processing', 'pending'])('polls active status %s', (status) => {
		expect(isActivePaymentStatus(status)).toBe(true);
	});
	it.each(['approved', 'review', 'rejected', 'expired', 'cancelled'])('stops polling %s', (status) => {
		expect(isActivePaymentStatus(status)).toBe(false);
	});
	it('does not show unknown status as approved', () => {
		expect(paymentStatusMessage('unknown')).toContain('revisão');
	});
});

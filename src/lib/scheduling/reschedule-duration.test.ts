import { describe, expect, it } from 'vitest';
import { getRescheduleDurationMinutes } from './reschedule-duration';

const scheduledAt = new Date('2026-11-24T22:00:00Z');
const endsAt = new Date('2026-11-24T22:30:00Z');
const item = (durationMinutes: number) => ({ service: { durationMinutes } });

describe('duração do reagendamento', () => {
	it('considera os serviços adicionados após a reserva', () => {
		expect(getRescheduleDurationMinutes({ scheduledAt, endsAt, items: [item(30), item(20)] })).toBe(50);
	});
	it('preserva a reserva quando há apenas produtos ou menos serviços', () => {
		expect(getRescheduleDurationMinutes({ scheduledAt, endsAt, items: [] })).toBe(30);
		expect(getRescheduleDurationMinutes({ scheduledAt, endsAt, items: [item(10)] })).toBe(30);
	});
	it('usa serviços para registros legados e fallback quando não existe duração', () => {
		expect(getRescheduleDurationMinutes({ scheduledAt, endsAt: null, items: [item(45)] })).toBe(45);
		expect(getRescheduleDurationMinutes({ scheduledAt, endsAt: null, items: [] })).toBe(30);
	});
});

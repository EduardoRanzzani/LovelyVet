import { describe, expect, it } from 'vitest';

import { canDeleteTimelineItem, deletableTimelineItemTypes, deleteTimelineItemSchema } from './timeline.schema';

const validInput = {
	id: '8dfc76df-67dc-456f-b7ed-aa13b99a0123',
	petId: '673651c6-ddd1-41e2-ae75-2f8ae94ef22f',
};

describe('deleteTimelineItemSchema', () => {
	it.each(['prescription', 'referral', 'exam_request', 'weight', 'vaccine', 'note'] as const)(
		'accepts deletable timeline type: %s',
		(type) => {
			const result = deleteTimelineItemSchema.safeParse({
				...validInput,
				type,
			});

			expect(result.success).toBe(true);
		},
	);

	it.each(['record', 'appointment', 'pathology', 'attachment'] as const)(
		'rejects non-deletable timeline type: %s',
		(type) => {
			const result = deleteTimelineItemSchema.safeParse({
				...validInput,
				type,
			});

			expect(result.success).toBe(false);
		},
	);

	it('rejects an invalid item id', () => {
		const result = deleteTimelineItemSchema.safeParse({
			...validInput,
			id: 'invalid-id',
			type: 'note',
		});

		expect(result.success).toBe(false);
	});

	it('rejects an invalid pet id', () => {
		const result = deleteTimelineItemSchema.safeParse({
			...validInput,
			petId: 'invalid-pet',
			type: 'note',
		});

		expect(result.success).toBe(false);
	});
});

describe('canDeleteTimelineItem', () => {
	it.each(deletableTimelineItemTypes)('allows shared clinical deletion of %s for Admin and Doctor only', (type) => {
		const item = { id: validInput.id, type };
		expect(canDeleteTimelineItem('admin', item)).toBe(true);
		expect(canDeleteTimelineItem('doctor', item)).toBe(true);
		expect(canDeleteTimelineItem('customer', item)).toBe(false);
	});

	it.each(['prescription', 'vaccine'] as const)('respects a protected %s for both staff profiles', (type) => {
		const item = { id: validInput.id, type, canDelete: false };
		expect(canDeleteTimelineItem('admin', item)).toBe(false);
		expect(canDeleteTimelineItem('doctor', item)).toBe(false);
	});

	it.each(['record', 'appointment', 'pathology', 'attachment'] as const)('blocks unsupported %s', (type) => {
		expect(canDeleteTimelineItem('admin', { id: validInput.id, type, canDelete: true })).toBe(false);
	});

	it('blocks a missing id', () => {
		expect(canDeleteTimelineItem('doctor', { type: 'note' })).toBe(false);
	});
});

import { describe, expect, it } from 'vitest';

import { deleteTimelineItemSchema } from './timeline.schema';

const validInput = {
	id: '8dfc76df-67dc-456f-b7ed-aa13b99a0123',
	petId: '673651c6-ddd1-41e2-ae75-2f8ae94ef22f',
};

describe('deleteTimelineItemSchema', () => {
	it.each([
		'prescription',
		'referral',
		'exam_request',
		'weight',
		'vaccine',
		'note',
	] as const)('accepts deletable timeline type: %s', (type) => {
		const result = deleteTimelineItemSchema.safeParse({
			...validInput,
			type,
		});

		expect(result.success).toBe(true);
	});

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

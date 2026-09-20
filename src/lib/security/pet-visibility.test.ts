import { describe, expect, it } from 'vitest';

import type { PetsWithRelations } from '@/api/schema/pets.schema';
import type { AuthContext } from '@/lib/security/auth-context';
import { filterPetForViewer } from '@/lib/security/pet-visibility';

const pet = {
	id: 'pet-id',
	notes: [{ id: 'internal-note' }],
	petTutors: [
		{ tutor: { id: 'viewer-customer-id' } },
		{ tutor: { id: 'other-customer-id' } },
	],
} as unknown as PetsWithRelations;

const context = (role: AuthContext['role']): AuthContext => ({
	clerkUserId: 'clerk-user-id',
	userId: 'local-user-id',
	role,
	customerId: role === 'customer' ? 'viewer-customer-id' : null,
	doctorId: role === 'doctor' ? 'doctor-id' : null,
});

describe('filterPetForViewer', () => {
	it('removes internal notes and other tutors from a customer response', () => {
		const visiblePet = filterPetForViewer(context('customer'), pet);

		expect(visiblePet.notes).toEqual([]);
		expect(visiblePet.petTutors).toHaveLength(1);
		expect(visiblePet.petTutors[0]?.tutor.id).toBe('viewer-customer-id');
	});

	it.each(['admin', 'doctor'] as const)(
		'preserves the full record for %s',
		(role) => {
			expect(filterPetForViewer(context(role), pet)).toBe(pet);
		},
	);
});

import { describe, expect, it } from 'vitest';

import type { PetsWithRelations } from '@/api/schema/pets.schema';
import type { AuthContext } from '@/lib/security/auth-context';
import { filterPetForViewer } from '@/lib/security/pet-visibility';

const context = (role: AuthContext['role']): AuthContext => ({
	clerkUserId: 'clerk-user-id',
	userId: 'local-user-id',
	role,
	customerId: role === 'customer' ? 'viewer-customer-id' : null,
	doctorId: role === 'doctor' ? 'doctor-id' : null,
});

const privateUser = (name: string, role: 'customer' | 'doctor' = 'customer') => ({
	id: `${name}-user-id`,
	name,
	email: `${name.toLowerCase().replaceAll(' ', '.')}@example.com`,
	image: null,
	role,
	isRegistrationComplete: true,
	createdAt: new Date('2026-01-01T00:00:00.000Z'),
	updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

const doctor = {
	id: 'doctor-id',
	userId: 'doctor-user-id',
	phone: '67999999999',
	cpf: '12345678900',
	gender: 'female' as const,
	licenseNumber: '1234',
	licenseState: 'MS',
	specialty: 'Clínica geral',
	availableFromWeekDay: 1,
	availableToWeekDay: 5,
	availableFromTime: '08:00:00',
	availableToTime: '18:00:00',
	createdAt: new Date('2026-01-01T00:00:00.000Z'),
	updatedAt: new Date('2026-01-01T00:00:00.000Z'),
	user: privateUser('Dra Regina', 'doctor'),
};

const tutor = (id: string, name: string) => ({
	id,
	userId: `${id}-user-id`,
	phone: '67988887777',
	cpf: '98765432100',
	gender: 'male' as const,
	postalCode: '79000000',
	address: 'Rua privada',
	addressNumber: '123',
	neighborhood: 'Centro',
	city: 'Campo Grande',
	state: 'MS',
	createdAt: new Date('2026-01-01T00:00:00.000Z'),
	updatedAt: new Date('2026-01-01T00:00:00.000Z'),
	user: privateUser(name),
});

const createPet = () =>
	({
		id: 'pet-id',
		name: 'Rex',
		notes: [
			{
				id: 'internal-note',
				content: 'Observação interna',
				author: privateUser('Equipe'),
			},
		],
		petTutors: [
			{ tutor: tutor('viewer-customer-id', 'Tutor Atual') },
			{ tutor: tutor('other-customer-id', 'Outro Tutor') },
		],
		medicalRecords: [{ id: 'record-id', doctor }],
		prescriptions: [
			{
				id: 'prescription-id',
				doctor,
				documentData: {
					tutor: { id: 'viewer-customer-id', name: 'Tutor Atual' },
				},
			},
			{
				id: 'other-tutor-prescription-id',
				doctor,
				documentData: {
					tutor: { id: 'other-customer-id', name: 'Outro Tutor' },
				},
			},
		],
		appointments: [{ id: 'appointment-id', doctor }],
		vaccines: [{ id: 'vaccine-id', doctor }],
		pathologies: [{ id: 'pathology-id', doctor }],
		clinicalDocuments: [
			{
				id: 'document-id',
				doctor,
				documentData: {
					tutor: { id: 'viewer-customer-id', name: 'Tutor Atual' },
				},
			},
			{
				id: 'other-tutor-document-id',
				doctor,
				documentData: {
					tutor: { id: 'other-customer-id', name: 'Outro Tutor' },
				},
			},
		],
		weightHistory: [
			{
				id: 'weight-id',
				author: privateUser('Autor Peso', 'doctor'),
			},
		],
		attachments: [
			{
				id: 'attachment-id',
				author: privateUser('Autor Anexo', 'doctor'),
			},
		],
	}) as unknown as PetsWithRelations;

describe('filterPetForViewer', () => {
	it('removes other tutors, internal notes and customer PII from a customer response', () => {
		const visiblePet = filterPetForViewer(context('customer'), createPet());

		expect(visiblePet.notes).toEqual([]);
		expect(visiblePet.petTutors).toHaveLength(1);

		const visibleTutor = visiblePet.petTutors[0]?.tutor;
		expect(visibleTutor?.id).toBe('viewer-customer-id');
		expect(visibleTutor?.user.name).toBe('Tutor Atual');
		expect(visibleTutor?.user.email).toBe('');
		expect(visibleTutor?.phone).toBe('');
		expect(visibleTutor?.cpf).toBe('');
		expect(visibleTutor?.postalCode).toBe('');
		expect(visibleTutor?.address).toBe('');
		expect(visibleTutor?.addressNumber).toBe('');
		expect(visibleTutor?.neighborhood).toBe('');
		expect(visibleTutor?.city).toBe('');
		expect(visibleTutor?.state).toBe('');

		expect(
			visiblePet.petTutors.some(
				({ tutor: visible }) => visible.id === 'other-customer-id',
			),
		).toBe(false);
	});

	it('removes doctor and author contact data from customer-visible history', () => {
		const visiblePet = filterPetForViewer(context('customer'), createPet());

		const relatedDoctors = [
			visiblePet.medicalRecords?.[0]?.doctor,
			visiblePet.prescriptions?.[0]?.doctor,
			visiblePet.appointments?.[0]?.doctor,
			visiblePet.vaccines?.[0]?.doctor,
			visiblePet.pathologies?.[0]?.doctor,
			visiblePet.clinicalDocuments?.[0]?.doctor,
		];

		for (const visibleDoctor of relatedDoctors) {
			expect(visibleDoctor?.phone).toBe('');
			expect(visibleDoctor?.cpf).toBe('');
			expect(visibleDoctor?.user.email).toBe('');
			expect(visibleDoctor?.user.name).toBe('Dra Regina');
		}

		expect(visiblePet.weightHistory?.[0]?.author?.email).toBe('');
		expect(visiblePet.attachments?.[0]?.author.email).toBe('');
	});


	it('hides tutor-scoped documents issued to another tutor of the same pet', () => {
		const visiblePet = filterPetForViewer(context('customer'), createPet());

		expect(visiblePet.prescriptions?.map(({ id }) => id)).toEqual([
			'prescription-id',
		]);
		expect(visiblePet.clinicalDocuments?.map(({ id }) => id)).toEqual([
			'document-id',
		]);
	});

	it.each(['admin', 'doctor'] as const)(
		'preserves the full record for %s',
		(role) => {
			const pet = createPet();
			expect(filterPetForViewer(context(role), pet)).toBe(pet);
		},
	);
});

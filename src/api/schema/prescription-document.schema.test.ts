import { describe, expect, it } from 'vitest';
import {
	prescriptionDocumentDataSchema,
	savePrescriptionDocumentSchema,
} from './prescription-document.schema';

const validInput = {
	petId: '11111111-1111-4111-8111-111111111111',
	tutorId: '22222222-2222-4222-8222-222222222222',
	doctorId: '33333333-3333-4333-8333-333333333333',
	isControlled: false,
	groups: [
		{
			administrationRoute: 'USO ORAL',
			items: [
				{
					sourceId: null,
					name: 'Dipirona',
					pharmacy: 'Veterinária',
					quantity: '1 caixa',
					orientations: '<p>Administrar conforme prescrição.</p>',
				},
			],
		},
	],
};

describe('Títulos dos blocos de orientações', () => {
	it('aceita um título personalizado', () => {
		const result = savePrescriptionDocumentSchema.parse({
			...validInput,
			orientationBlocks: [
				{
					title: 'Cuidados pós-operatórios',
					content: '<p>Manter repouso.</p>',
				},
			],
		});

		expect(result.orientationBlocks[0].title).toBe('Cuidados pós-operatórios');
	});

	it('exige título para novas orientações', () => {
		const result = savePrescriptionDocumentSchema.safeParse({
			...validInput,
			orientationBlocks: [
				{
					title: '   ',
					content: '<p>Manter repouso.</p>',
				},
			],
		});

		expect(result.success).toBe(false);
	});

	it('aceita receitas antigas sem título nas orientações', () => {
		const result = prescriptionDocumentDataSchema.safeParse({
			tutor: {
				id: validInput.tutorId,
				name: 'Maria',
			},
			patient: {
				name: 'Thor',
				species: 'Canino',
				breed: 'SRD',
				age: '3 anos',
				weight: '10 kg',
				sex: 'M',
			},
			groups: validInput.groups,
			orientationBlocks: [{ content: '<p>Orientação antiga.</p>' }],
		});

		expect(result.success).toBe(true);
	});
});

import { describe, expect, it } from 'vitest';
import {
	savePrescriptionDocumentSchema,
	prescriptionDocumentDataSchema,
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

describe('prescription orientation blocks', () => {
	it('permite salvar receita sem orientações gerais', () => {
		const result = savePrescriptionDocumentSchema.parse(validInput);

		expect(result.orientationBlocks).toEqual([]);
	});

	it('permite adicionar múltiplos blocos de orientações', () => {
		const result = savePrescriptionDocumentSchema.parse({
			...validInput,
			orientationBlocks: [
				{ content: '<p>Manter repouso.</p>' },
				{ content: '<p>Retornar em 7 dias.</p>' },
			],
		});

		expect(result.orientationBlocks).toHaveLength(2);
		expect(result.orientationBlocks[0].content).toContain('Manter repouso');
	});

	it('rejeita bloco sem conteúdo', () => {
		const result = savePrescriptionDocumentSchema.safeParse({
			...validInput,
			orientationBlocks: [{ content: '' }],
		});

		expect(result.success).toBe(false);
	});

	it('rejeita conteúdo apenas com espaços', () => {
		const result = savePrescriptionDocumentSchema.safeParse({
			...validInput,
			orientationBlocks: [{ content: '   ' }],
		});

		expect(result.success).toBe(false);
	});

	it('preserva compatibilidade com receitas anteriores', () => {
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
		});

		expect(result.success).toBe(true);
	});
});

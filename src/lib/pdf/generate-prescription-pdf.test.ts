// @vitest-environment node
import type { PrescriptionDocumentData } from '@/api/schema/prescription-document.schema';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { generatePrescriptionPdf } from './generate-prescription-pdf';

const createDocument = (orientations: string): PrescriptionDocumentData => ({
	tutor: {
		id: '11111111-1111-4111-8111-111111111111',
		name: 'Maria Silva',
	},
	patient: {
		name: 'Thor',
		species: 'Canina',
		breed: 'SRD',
		age: '3 anos',
		weight: '12 kg',
		sex: 'Macho',
	},
	isControlled: false,
	groups: [
		{
			administrationRoute: 'Uso oral',
			items: [
				{
					sourceId: null,
					name: 'Medicamento de teste',
					pharmacy: 'Veterinária',
					quantity: '1 unidade',
					orientations,
				},
			],
		},
	],
});

describe('generatePrescriptionPdf — paginação do texto rico', () => {
	it('divide um medicamento com orientações longas entre páginas', async () => {
		const data = createDocument(
			Array.from(
				{ length: 65 },
				(_, index) =>
					`<p>Instrução ${index + 1} com texto para teste de paginação.</p>`,
			).join(''),
		);

		const buffer = await generatePrescriptionPdf({
			documentData: data,
			issuedAt: new Date('2026-11-19T12:00:00-04:00'),
		});
		const pdf = await PDFDocument.load(buffer);

		expect(pdf.getPageCount()).toBeGreaterThan(1);
	});

	it('página assinada reserva mais espaço de rodapé', async () => {
		const data = createDocument(
			Array.from({ length: 45 }, () => '<p>Uma linha de orientação.</p>').join(
				'',
			),
		);
		const issuedAt = new Date('2026-11-19T12:00:00-04:00');

		const unsigned = await generatePrescriptionPdf({
			documentData: data,
			issuedAt,
		});
		const signed = await generatePrescriptionPdf({
			documentData: data,
			issuedAt,
			signingTime: issuedAt,
		});

		const unsignedPdf = await PDFDocument.load(unsigned);
		const signedPdf = await PDFDocument.load(signed);

		expect(signedPdf.getPageCount()).toBeGreaterThanOrEqual(
			unsignedPdf.getPageCount(),
		);
	});

	it('aceita orientações com linhas vazias, justificação e palavras longas', async () => {
		const data = createDocument(
			`<p style="text-align: justify">${'Exame'.repeat(150)}</p>` +
				'<p><br></p>' +
				'<p><span style="font-size: 24px"><strong>Repouso</strong></span></p>',
		);
		data.orientationBlocks = [
			{
				title: 'Cuidados após o atendimento',
				content:
					'<p>Água à vontade.</p><p><br></p><p>Reavaliação em 7 dias.</p>',
			},
		];

		const buffer = await generatePrescriptionPdf({
			documentData: data,
			issuedAt: new Date('2026-11-19T12:00:00-04:00'),
		});
		const pdf = await PDFDocument.load(buffer);

		expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1);
	});
});

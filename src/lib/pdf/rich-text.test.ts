import { describe, expect, it } from 'vitest';
import { parseRichTextHtml } from './rich-text';

describe('parseRichTextHtml', () => {
	it('preserves bold, italic and paragraph alignment', () => {
		const result = parseRichTextHtml(
			'<p style="text-align: center">Administrar <strong>às 8h</strong> e <em>às 20h</em></p>',
		);

		expect(result).toEqual([
			{
				alignment: 'center',
				runs: [
					{ text: 'Administrar ', bold: false, italic: false },
					{ text: 'às 8h', bold: true, italic: false },
					{ text: ' e ', bold: false, italic: false },
					{ text: 'às 20h', bold: false, italic: true },
				],
			},
		]);
	});

	it('preserva parágrafos vazios entre textos', () => {
		const result = parseRichTextHtml(
			'<p>Primeiro</p><p><br></p><p>Segundo</p>',
		);

		expect(result).toHaveLength(3);

		expect(result[0].runs[0].text).toBe('Primeiro');
		expect(result[1].runs).toEqual([]);
		expect(result[2].runs[0].text).toBe('Segundo');
	});

	it('preserva quebras explícitas com br', () => {
		const result = parseRichTextHtml('<p>Linha um<br>Linha dois</p>');

		expect(result[0].runs.map((run) => run.text).join('')).toBe(
			'Linha um\nLinha dois',
		);
	});

	it('interpreta justificação e tamanho de fonte', () => {
		const result = parseRichTextHtml(
			'<p style="text-align: justify">' +
				'<span style="font-size: 18px">Texto maior</span>' +
				'</p>',
		);

		expect(result[0].alignment).toBe('justify');
		expect(result[0].runs[0].fontSize).toBe(18);
		expect(result[0].runs[0].text).toBe('Texto maior');
	});

	it('preserva numeração de listas com parágrafos internos', () => {
		const result = parseRichTextHtml(
			'<ol>' + '<li><p>Primeiro</p></li>' + '<li><p>Segundo</p></li>' + '</ol>',
		);

		expect(
			result.map((paragraph) => paragraph.runs.map((run) => run.text).join('')),
		).toEqual(['1. Primeiro', '2. Segundo']);
	});

	it('preserves ordered and unordered list markers', () => {
		const result = parseRichTextHtml(
			'<ul><li>Primeiro</li><li><strong>Segundo</strong></li></ul><ol><li>Terceiro</li></ol>',
		);

		expect(
			result.map((paragraph) => paragraph.runs.map((run) => run.text).join('')),
		).toEqual(['• Primeiro', '• Segundo', '1. Terceiro']);
	});
});

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

	it('preserves ordered and unordered list markers', () => {
		const result = parseRichTextHtml(
			'<ul><li>Primeiro</li><li><strong>Segundo</strong></li></ul><ol><li>Terceiro</li></ol>',
		);

		expect(result.map((paragraph) => paragraph.runs.map((run) => run.text).join(''))).toEqual([
			'• Primeiro',
			'• Segundo',
			'1. Terceiro',
		]);
	});
});

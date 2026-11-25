import { describe, expect, it } from 'vitest';
import { sanitizeRichTextHtml } from './html';

describe('sanitizeRichTextHtml', () => {
	it('preserva o alinhamento justificado', () => {
		const result = sanitizeRichTextHtml('<p style="text-align: justify">Texto justificado</p>');

		expect(result).toContain('text-align: justify');
		expect(result).toContain('Texto justificado');
	});

	it('preserva tamanhos de fonte permitidos', () => {
		const result = sanitizeRichTextHtml('<p><span style="font-size: 18px">Texto maior</span></p>');

		expect(result).toContain('font-size: 18px');
		expect(result).toContain('<span');
	});

	it('remove propriedades CSS não permitidas', () => {
		const result = sanitizeRichTextHtml(
			'<span style="font-size: 18px; color: red; position: absolute">' + 'Texto' + '</span>',
		);

		expect(result).toContain('font-size: 18px');
		expect(result).not.toContain('color: red');
		expect(result).not.toContain('position: absolute');
	});

	it('remove tamanhos fora da lista permitida', () => {
		const result = sanitizeRichTextHtml('<span style="font-size: 100px">Texto</span>');

		expect(result).not.toContain('font-size');
	});

	it('mantém parágrafos vazios', () => {
		const result = sanitizeRichTextHtml('<p>Antes</p><p><br></p><p>Depois</p>');

		expect(result).toContain('<p><br></p>');
	});

	it('remove manipuladores de eventos', () => {
		const result = sanitizeRichTextHtml('<p onclick="alert(1)">Texto seguro</p>');

		expect(result).not.toContain('onclick');
		expect(result).toContain('Texto seguro');
	});
});

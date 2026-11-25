import { describe, expect, it } from 'vitest';
import { richTextToPlainText, sanitizePrescriptionPreviewHtml, sanitizeRichTextHtml } from './html';

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

describe('sanitizePrescriptionPreviewHtml', () => {
	it('preserva estrutura e estilos fixos do HTML gerado pela receita', () => {
		const result = sanitizePrescriptionPreviewHtml(
			'<div class="prescription-content" style="display: flex; flex-direction: column; gap: 4px"><section><h3 style="text-transform: uppercase; text-align: center">Uso oral</h3><div style="flex: 1; border-bottom: 1px solid #000"></div><div class="orientations-box rich-text-content" style="font-size: 13px; line-height: 1.5"><p><strong>Medicamento</strong></p></div></section></div>',
		);
		expect(result).toContain('class="prescription-content"');
		expect(result).toContain('<section>');
		expect(result).toContain('<h3 style="text-transform: uppercase; text-align: center">');
		expect(result).toContain('border-bottom: 1px solid #000');
		expect(result).toContain('font-size: 13px; line-height: 1.5');
		expect(result).toContain('<strong>Medicamento</strong>');
	});

	it('remove HTML ativo, classes externas e CSS arbitrário de registros antigos', () => {
		const result = sanitizePrescriptionPreviewHtml(
			'<div class="rich-text-content fixed" onclick="alert(1)" style="position: fixed; background: url(https://example.com); display: flex"><img src=x onerror=alert(1)><script>alert(1)</script><p>Seguro</p></div>',
		);
		expect(result).toContain('class="rich-text-content"');
		expect(result).toContain('display: flex');
		expect(result).toContain('<p>Seguro</p>');
		for (const forbidden of ['onclick', '<img', '<script', 'position:', 'background:', ' fixed']) {
			expect(result).not.toContain(forbidden);
		}
	});
});

describe('richTextToPlainText', () => {
	it('retorna texto e entidades decodificadas sem depender de DOMParser global', () => {
		expect(richTextToPlainText('<p>Água &amp; <strong>alimento</strong></p>')).toBe('Água & alimento');
	});

	it('não retorna marcação ativa', () => {
		expect(richTextToPlainText('<p>Seguro</p><script>alert(1)</script><img src=x onerror=alert(1)>')).toBe(
			'Seguro',
		);
	});
});

/**
 * Converte orientações digitadas em texto simples
 * para HTML seguro, preservando as quebras de linha.
 */
export function generalOrientationsToHtml(value?: string): string {
	const normalized = value?.trim().replace(/\r\n?/g, '\n');

	if (!normalized) {
		return '';
	}

	return normalized
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;')
		.replaceAll('\n', '<br />');
}

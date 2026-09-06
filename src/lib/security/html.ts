import DOMPurify from 'isomorphic-dompurify';

const RICH_TEXT_TAGS = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'] as const;

/**
 * Mantém somente text-align gerado pelo Tiptap.
 * Qualquer outro CSS inline é descartado.
 */
const keepSafeTextAlign = (html: string): string => {
	return html.replace(
		/\sstyle=(["'])(.*?)\1/gi,
		(_match, _quote, styleValue: string) => {
			const declarations = styleValue
				.split(';')
				.map((value) => value.trim())
				.filter(Boolean);

			for (const declaration of declarations) {
				const [property, value] = declaration
					.split(':')
					.map((part) => part.trim().toLowerCase());

				if (
					property === 'text-align' &&
					['left', 'center', 'right'].includes(value)
				) {
					return ` style="text-align: ${value}"`;
				}
			}

			return '';
		},
	);
};

export const sanitizeRichTextHtml = (html: string): string => {
	const sanitized = DOMPurify.sanitize(html, {
		ALLOWED_TAGS: [...RICH_TEXT_TAGS],
		ALLOWED_ATTR: ['style'],
	});

	return keepSafeTextAlign(sanitized);
};

export const escapeHtml = (value: string): string => {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
};

/**
 * Para limpeza de registros antigos.
 *
 * Preserva estrutura básica, mas deliberadamente
 * remove atributos/styles potencialmente inseguros.
 */
export const sanitizeLegacyPrescriptionHtml = (html: string): string => {
	return DOMPurify.sanitize(html, {
		ALLOWED_TAGS: ['div', 'span', ...RICH_TEXT_TAGS],
		ALLOWED_ATTR: [],
	});
};

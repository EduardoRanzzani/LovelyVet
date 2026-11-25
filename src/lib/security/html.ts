import DOMPurify from 'isomorphic-dompurify';

const RICH_TEXT_TAGS = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'span'] as const;

const FONT_SIZES = new Set([10, 12, 14, 16, 18, 20, 22, 24]);

const TEXT_ALIGNMENTS = new Set(['left', 'center', 'right', 'justify']);

/**
 * Preserva apenas CSS seguro gerado pelo editor.
 * Não permite cores arbitrárias, position,
 * fontes externas ou demais propriedades CSS.
 */
const keepSafeStyles = (html: string): string => {
	return html.replace(/\sstyle=(["'])([\s\S]*?)\1/gi, (_match, _quote, styleValue: string) => {
		const safeDeclarations: string[] = [];

		for (const declaration of styleValue.split(';')) {
			const separator = declaration.indexOf(':');

			if (separator === -1) continue;

			const property = declaration.slice(0, separator).trim().toLowerCase();

			const value = declaration
				.slice(separator + 1)
				.trim()
				.toLowerCase();

			if (property === 'text-align' && TEXT_ALIGNMENTS.has(value)) {
				safeDeclarations.push(`text-align: ${value}`);
				continue;
			}

			if (property === 'font-size') {
				const match = /^(10|12|14|16|18|20|22|24)px$/.exec(value);

				if (match && FONT_SIZES.has(Number(match[1]))) {
					safeDeclarations.push(`font-size: ${match[1]}px`);
				}
			}
		}

		if (safeDeclarations.length === 0) {
			return '';
		}

		return ` style="${safeDeclarations.join('; ')}"`;
	});
};

export const sanitizeRichTextHtml = (html: string): string => {
	const sanitized = DOMPurify.sanitize(html, {
		ALLOWED_TAGS: [...RICH_TEXT_TAGS],
		ALLOWED_ATTR: ['style'],
	});

	return keepSafeStyles(sanitized);
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
 * Usado exclusivamente na limpeza de registros antigos.
 */
export const sanitizeLegacyPrescriptionHtml = (html: string): string => {
	return DOMPurify.sanitize(html, {
		ALLOWED_TAGS: ['div', 'span', ...RICH_TEXT_TAGS],
		ALLOWED_ATTR: [],
	});
};

import DOMPurify from 'isomorphic-dompurify';

const RICH_TEXT_TAGS = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'span'] as const;

const FONT_SIZES = new Set([10, 12, 14, 16, 18, 20, 22, 24]);

const TEXT_ALIGNMENTS = new Set(['left', 'center', 'right', 'justify']);

// Declarações fixas da representação HTML gerada por prescriptions.actions.ts.
const PRESCRIPTION_LAYOUT_STYLES = new Set([
	'display: flex',
	'flex-direction: column',
	'gap: 0px',
	'gap: 4px',
	'margin-bottom: 12px',
	'margin-bottom: 3px',
	'margin-bottom: 24px',
	'margin-top: 2px',
	'margin: 0 0 12px',
	'align-items: baseline',
	'width: 100%',
	'font-size: 15px',
	'font-size: 13px',
	'font-weight: bold',
	'white-space: nowrap',
	'flex: 1',
	'border-bottom: 1px solid #000',
	'line-height: 1.5',
	'text-transform: uppercase',
]);
const PRESCRIPTION_CLASSES = new Set(['prescription-content', 'orientations-box', 'rich-text-content']);

/**
 * Preserva apenas CSS seguro gerado pelo editor.
 * Não permite cores arbitrárias, position,
 * fontes externas ou demais propriedades CSS.
 */
const keepSafeStyles = (html: string, preservePrescriptionLayout = false): string => {
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

			if (preservePrescriptionLayout && PRESCRIPTION_LAYOUT_STYLES.has(`${property}: ${value}`)) {
				safeDeclarations.push(`${property}: ${value}`);
				continue;
			}

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

/** Sanitiza o HTML histórico sem remover a estrutura da receita gerada pelo servidor. */
export const sanitizePrescriptionPreviewHtml = (html: string): string => {
	const sanitized = DOMPurify.sanitize(html, {
		ALLOWED_TAGS: ['div', 'section', 'h3', ...RICH_TEXT_TAGS],
		ALLOWED_ATTR: ['style', 'class'],
		ALLOW_DATA_ATTR: false,
		ALLOW_ARIA_ATTR: false,
	});

	const safeClasses = sanitized.replace(/\sclass=(["'])([\s\S]*?)\1/gi, (_match, _quote, value: string) => {
		const classes = value.split(/\s+/).filter((name) => PRESCRIPTION_CLASSES.has(name));
		return classes.length ? ` class="${classes.join(' ')}"` : '';
	});

	return keepSafeStyles(safeClasses, true);
};

/** Extrai texto também durante SSR; não depende do DOMParser global do navegador. */
export const richTextToPlainText = (html: string): string => {
	const body = DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [], RETURN_DOM: true });
	return body.textContent ?? '';
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

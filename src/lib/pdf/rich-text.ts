export type RichTextAlignment = 'left' | 'center' | 'right';

export interface RichTextRun {
	text: string;
	bold: boolean;
	italic: boolean;
}

export interface RichTextParagraph {
	runs: RichTextRun[];
	alignment: RichTextAlignment;
}

const decodeHtmlEntities = (value: string): string =>
	value
		.replace(/&#x([0-9a-f]+);/gi, (_match, hexadecimal: string) => {
			const codePoint = Number.parseInt(hexadecimal, 16);
			return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : '';
		})
		.replace(/&#(\d+);/g, (_match, decimal: string) => {
			const codePoint = Number.parseInt(decimal, 10);
			return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : '';
		})
		.replaceAll('&nbsp;', ' ')
		.replaceAll('&amp;', '&')
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&quot;', '"')
		.replaceAll('&#039;', "'");

const readAlignment = (tag: string): RichTextAlignment => {
	const match = tag.match(/text-align\s*:\s*(left|center|right)/i);
	return (match?.[1]?.toLowerCase() as RichTextAlignment | undefined) ?? 'left';
};

/**
 * Converte o subconjunto de HTML aceito pelo editor em blocos próprios para PDF.
 * O sanitizador do servidor limita a entrada a parágrafos, listas, negrito,
 * itálico, quebras de linha e alinhamento.
 */
export const parseRichTextHtml = (html: string): RichTextParagraph[] => {
	const paragraphs: RichTextParagraph[] = [];
	let runs: RichTextRun[] = [];
	let alignment: RichTextAlignment = 'left';
	let boldDepth = 0;
	let italicDepth = 0;
	const lists: Array<{ type: 'ul' | 'ol'; counter: number }> = [];

	const append = (text: string) => {
		if (text === '\n') {
			runs.push({ text, bold: boldDepth > 0, italic: italicDepth > 0 });
			return;
		}

		const decoded = decodeHtmlEntities(text).replace(/[\t\r\n ]+/g, ' ');
		if (!decoded) return;

		const previous = runs.at(-1);
		if (
			previous &&
			previous.bold === (boldDepth > 0) &&
			previous.italic === (italicDepth > 0)
		) {
			previous.text += decoded;
			return;
		}

		runs.push({
			text: decoded,
			bold: boldDepth > 0,
			italic: italicDepth > 0,
		});
	};

	const finishParagraph = () => {
		while (runs[0]?.text.trim() === '') runs.shift();
		while (runs.at(-1)?.text.trim() === '') runs.pop();

		if (runs.some((run) => run.text.trim().length > 0)) {
			paragraphs.push({ runs, alignment });
		}

		runs = [];
		alignment = 'left';
	};

	for (const token of html.match(/<[^>]+>|[^<]+/g) ?? []) {
		if (!token.startsWith('<')) {
			append(token);
			continue;
		}

		const normalized = token.toLowerCase();

		if (/^<p(?:\s|>)/i.test(token)) {
			finishParagraph();
			alignment = readAlignment(token);
		} else if (normalized === '</p>') {
			finishParagraph();
		} else if (/^<br\s*\/?\s*>$/i.test(token)) {
			append('\n');
		} else if (/^<(strong|b)(?:\s|>)/i.test(token)) {
			boldDepth += 1;
		} else if (/^<\/(strong|b)>$/i.test(token)) {
			boldDepth = Math.max(0, boldDepth - 1);
		} else if (/^<(em|i)(?:\s|>)/i.test(token)) {
			italicDepth += 1;
		} else if (/^<\/(em|i)>$/i.test(token)) {
			italicDepth = Math.max(0, italicDepth - 1);
		} else if (/^<(ul|ol)(?:\s|>)/i.test(token)) {
			lists.push({ type: normalized.startsWith('<ol') ? 'ol' : 'ul', counter: 0 });
		} else if (/^<\/(ul|ol)>$/i.test(token)) {
			finishParagraph();
			lists.pop();
		} else if (/^<li(?:\s|>)/i.test(token)) {
			finishParagraph();
			const list = lists.at(-1);
			if (list?.type === 'ol') {
				list.counter += 1;
				append(`${list.counter}. `);
			} else {
				append('• ');
			}
		} else if (normalized === '</li>' || normalized === '</div>') {
			finishParagraph();
		}
	}

	finishParagraph();
	return paragraphs;
};

export type RichTextAlignment = 'left' | 'center' | 'right' | 'justify';

export interface RichTextRun {
	text: string;
	bold: boolean;
	italic: boolean;
	fontSize?: number;
}

export interface RichTextParagraph {
	runs: RichTextRun[];
	alignment: RichTextAlignment;
}

const decodeHtmlEntities = (value: string): string =>
	value
		.replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) => {
			const number = Number.parseInt(hex, 16);
			return number <= 0x10ffff ? String.fromCodePoint(number) : '';
		})
		.replace(/&#(\d+);/g, (_match, decimal: string) => {
			const number = Number.parseInt(decimal, 10);
			return number <= 0x10ffff ? String.fromCodePoint(number) : '';
		})
		.replaceAll('&nbsp;', ' ')
		.replaceAll('&amp;', '&')
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&quot;', '"')
		.replaceAll('&#039;', "'")
		.replaceAll('&#39;', "'");

const readAlignment = (tag: string): RichTextAlignment => {
	const match = tag.match(/text-align\s*:\s*(left|center|right|justify)/i);

	return (match?.[1]?.toLowerCase() as RichTextAlignment | undefined) ?? 'left';
};

const readFontSize = (tag: string): number | undefined => {
	const match = tag.match(/font-size\s*:\s*(10|12|14|16|18|20|22|24)px\b/i);

	return match ? Number(match[1]) : undefined;
};

/**
 * Interpreta o subconjunto de HTML autorizado pelo
 * sanitizador da receita.
 *
 * Parágrafos vazios são mantidos como linhas
 * em branco intencionais.
 */
export const parseRichTextHtml = (html: string): RichTextParagraph[] => {
	const paragraphs: RichTextParagraph[] = [];

	let runs: RichTextRun[] = [];
	let alignment: RichTextAlignment = 'left';

	let boldDepth = 0;
	let italicDepth = 0;

	let activeFontSize: number | undefined;

	const fontSizeStack: Array<number | undefined> = [];

	const lists: Array<{
		type: 'ul' | 'ol';
		counter: number;
	}> = [];

	let paragraphOpen = false;
	let listItemOpen = false;

	const append = (raw: string) => {
		const text =
			raw === '\n' ? '\n' : decodeHtmlEntities(raw).replace(/[\t\r\n ]+/g, ' ');

		if (!text || (text.trim() === '' && runs.length === 0)) {
			return;
		}

		const current: RichTextRun = {
			text,
			bold: boldDepth > 0,
			italic: italicDepth > 0,
			...(activeFontSize ? { fontSize: activeFontSize } : {}),
		};

		const previous = runs.at(-1);

		if (
			previous &&
			previous.text !== '\n' &&
			text !== '\n' &&
			previous.bold === current.bold &&
			previous.italic === current.italic &&
			previous.fontSize === current.fontSize
		) {
			previous.text += text;
		} else {
			runs.push(current);
		}
	};

	const finishParagraph = (force = false) => {
		// <p><br></p> equivale a uma linha vazia.
		if (runs.length === 1 && runs[0].text === '\n') {
			runs = [];
		}

		if (
			force ||
			runs.some((run) => run.text.trim().length > 0 || run.text.includes('\n'))
		) {
			paragraphs.push({
				runs,
				alignment,
			});
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
			if (paragraphOpen) {
				finishParagraph(true);
			} else if (runs.length && !listItemOpen) {
				finishParagraph();
			}

			paragraphOpen = true;
			alignment = readAlignment(token);
		} else if (normalized === '</p>') {
			finishParagraph(true);
			paragraphOpen = false;
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
		} else if (/^<span(?:\s|>)/i.test(token)) {
			fontSizeStack.push(activeFontSize);

			activeFontSize = readFontSize(token) ?? activeFontSize;
		} else if (normalized === '</span>') {
			activeFontSize = fontSizeStack.pop();
		} else if (/^<(ul|ol)(?:\s|>)/i.test(token)) {
			finishParagraph();

			lists.push({
				type: normalized.startsWith('<ol') ? 'ol' : 'ul',
				counter: 0,
			});
		} else if (/^<\/(ul|ol)>$/i.test(token)) {
			finishParagraph();
			lists.pop();
		} else if (/^<li(?:\s|>)/i.test(token)) {
			finishParagraph();
			listItemOpen = true;

			const list = lists.at(-1);

			if (list?.type === 'ol') {
				list.counter += 1;
				append(`${list.counter}. `);
			} else {
				append('• ');
			}
		} else if (normalized === '</li>') {
			finishParagraph();
			listItemOpen = false;
		}
	}

	finishParagraph();

	return paragraphs;
};

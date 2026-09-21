import type { PrescriptionDocumentData } from '@/api/schema/prescription-document.schema';
import { normalizePrescriptionGroups } from '@/lib/prescriptions/normalize-prescription-groups';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
	PDFDocument,
	PageSizes,
	rgb,
	StandardFonts,
	type PDFFont,
	type PDFImage,
	type PDFPage,
} from 'pdf-lib';

interface GeneratePrescriptionPdfOptions {
	documentData: PrescriptionDocumentData;
	issuedAt: Date | string;
	signingTime?: Date;
}

interface PrescriptionPdfAssets {
	logo: Buffer;
	paws: Buffer;
}

interface PageResources {
	font: PDFFont;
	boldFont: PDFFont;
	logo: PDFImage;
	paws: PDFImage;
}

const PAGE_WIDTH = PageSizes.A4[0];
const PAGE_HEIGHT = PageSizes.A4[1];

const MARGIN_X = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const CONTENT_TOP = 535;
const CONTENT_BOTTOM = 165;

const BODY_FONT_SIZE = 10;
const BODY_LINE_HEIGHT = 12;

let assetsPromise: Promise<PrescriptionPdfAssets> | null = null;

const loadAssets = async (): Promise<PrescriptionPdfAssets> => {
	if (!assetsPromise) {
		assetsPromise = Promise.all([
			readFile(path.join(process.cwd(), 'public', 'logo.png')),
			readFile(path.join(process.cwd(), 'public', 'paw-decoration.png')),
		]).then(([logo, paws]) => ({
			logo,
			paws,
		}));
	}

	return assetsPromise;
};

const formatIssuedDate = (date: Date | string): string => {
	return new Intl.DateTimeFormat('pt-BR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'America/Campo_Grande',
	}).format(new Date(date));
};

const formatSigningDate = (date: Date): string => {
	return new Intl.DateTimeFormat('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		timeZone: 'America/Campo_Grande',
	}).format(date);
};

const decodeHtmlEntities = (value: string): string => {
	return value
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
};

const richTextToPlainText = (html: string): string => {
	const text = html
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<li[^>]*>/gi, '- ')
		.replace(/<\/li>/gi, '\n')
		.replace(/<\/p>/gi, '\n')
		.replace(/<\/?(?:ul|ol)[^>]*>/gi, '\n')
		.replace(/<[^>]+>/g, '');

	return decodeHtmlEntities(text)
		.replace(/\u00a0/g, ' ')
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
};

const fitText = (
	value: string,
	font: PDFFont,
	fontSize: number,
	maxWidth: number,
): string => {
	if (font.widthOfTextAtSize(value, fontSize) <= maxWidth) {
		return value;
	}

	let result = value;

	while (
		result.length > 0 &&
		font.widthOfTextAtSize(`${result}...`, fontSize) > maxWidth
	) {
		result = result.slice(0, -1);
	}

	return result ? `${result}...` : '';
};

const splitLongWord = (
	word: string,
	font: PDFFont,
	fontSize: number,
	maxWidth: number,
): string[] => {
	const parts: string[] = [];
	let current = '';

	for (const character of word) {
		const next = `${current}${character}`;

		if (current && font.widthOfTextAtSize(next, fontSize) > maxWidth) {
			parts.push(current);
			current = character;
			continue;
		}

		current = next;
	}

	if (current) {
		parts.push(current);
	}

	return parts;
};

const wrapText = (
	value: string,
	font: PDFFont,
	fontSize: number,
	maxWidth: number,
): string[] => {
	const result: string[] = [];

	for (const paragraph of value.split('\n')) {
		const normalized = paragraph.trim();

		if (!normalized) {
			result.push('');
			continue;
		}

		const words = normalized.split(/\s+/);
		let currentLine = '';

		for (const word of words) {
			const candidate = currentLine ? `${currentLine} ${word}` : word;

			if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
				currentLine = candidate;
				continue;
			}

			if (currentLine) {
				result.push(currentLine);
				currentLine = '';
			}

			if (font.widthOfTextAtSize(word, fontSize) <= maxWidth) {
				currentLine = word;
				continue;
			}

			const parts = splitLongWord(word, font, fontSize, maxWidth);

			if (parts.length > 1) {
				result.push(...parts.slice(0, -1));
			}

			currentLine = parts.at(-1) ?? '';
		}

		if (currentLine) {
			result.push(currentLine);
		}
	}

	return result;
};

const drawCenteredText = (
	page: PDFPage,
	text: string,
	y: number,
	font: PDFFont,
	size: number,
) => {
	const width = font.widthOfTextAtSize(text, size);

	page.drawText(text, {
		x: (PAGE_WIDTH - width) / 2,
		y,
		font,
		size,
		color: rgb(0, 0, 0),
	});
};

const drawRightText = (
	page: PDFPage,
	text: string,
	right: number,
	y: number,
	font: PDFFont,
	size: number,
) => {
	const width = font.widthOfTextAtSize(text, size);

	page.drawText(text, {
		x: right - width,
		y,
		font,
		size,
		color: rgb(0, 0, 0),
	});
};

const drawInfoCell = ({
	page,
	x,
	y,
	width,
	value,
	label,
	font,
	boldFont,
}: {
	page: PDFPage;
	x: number;
	y: number;
	width: number;
	value: string;
	label: string;
	font: PDFFont;
	boldFont: PDFFont;
}) => {
	page.drawText(fitText(value || '-', font, 9, width - 4), {
		x,
		y,
		font,
		size: 9,
		color: rgb(0, 0, 0),
	});

	page.drawLine({
		start: {
			x,
			y: y - 4,
		},
		end: {
			x: x + width,
			y: y - 4,
		},
		thickness: 0.65,
		color: rgb(0, 0, 0),
	});

	page.drawText(label, {
		x,
		y: y - 15,
		font: boldFont,
		size: 7.5,
		color: rgb(0, 0, 0),
	});
};

const drawPageDecoration = (page: PDFPage, resources: PageResources) => {
	const watermarkWidth = 300;
	const watermarkHeight =
		(watermarkWidth * resources.logo.height) / resources.logo.width;

	page.drawImage(resources.logo, {
		x: (PAGE_WIDTH - watermarkWidth) / 2,
		y: (PAGE_HEIGHT - watermarkHeight) / 2,
		width: watermarkWidth,
		height: watermarkHeight,
		opacity: 0.035,
	});

	const pawWidth = 165;
	const pawHeight = (pawWidth * resources.paws.height) / resources.paws.width;

	page.drawImage(resources.paws, {
		x: -14,
		y: PAGE_HEIGHT - pawHeight + 15,
		width: pawWidth,
		height: pawHeight,
		opacity: 0.9,
	});

	page.drawImage(resources.paws, {
		x: PAGE_WIDTH - pawWidth + 14,
		y: -15,
		width: pawWidth,
		height: pawHeight,
		opacity: 0.9,
	});
};

const drawHeader = (
	page: PDFPage,
	documentData: PrescriptionDocumentData,
	issuedAt: Date | string,
	resources: PageResources,
) => {
	const logoWidth = 64;
	const logoHeight = (logoWidth * resources.logo.height) / resources.logo.width;

	page.drawImage(resources.logo, {
		x: (PAGE_WIDTH - logoWidth) / 2,
		y: PAGE_HEIGHT - 91,
		width: logoWidth,
		height: logoHeight,
	});

	drawCenteredText(
		page,
		'Dra. Regina de Oliveira Maciel',
		PAGE_HEIGHT - 113,
		resources.boldFont,
		11,
	);

	drawCenteredText(
		page,
		'Médica Veterinária CRMV/MS 9193',
		PAGE_HEIGHT - 128,
		resources.font,
		8.5,
	);

	drawCenteredText(
		page,
		'SIPEAGRO MV00802562025',
		PAGE_HEIGHT - 140,
		resources.font,
		8.5,
	);

	const firstRowY = PAGE_HEIGHT - 183;
	const firstRowGap = 24;
	const firstRowWidth = (CONTENT_WIDTH - firstRowGap) / 2;

	drawInfoCell({
		page,
		x: MARGIN_X,
		y: firstRowY,
		width: firstRowWidth,
		value: documentData.tutor.name,
		label: 'Tutor',
		font: resources.font,
		boldFont: resources.boldFont,
	});

	drawInfoCell({
		page,
		x: MARGIN_X + firstRowWidth + firstRowGap,
		y: firstRowY,
		width: firstRowWidth,
		value: documentData.patient.name,
		label: 'Paciente',
		font: resources.font,
		boldFont: resources.boldFont,
	});

	const secondRowY = PAGE_HEIGHT - 223;

	const secondRowGap = 8;

	const secondRowWidth = (CONTENT_WIDTH - secondRowGap * 4) / 5;

	const patientValues = [
		[documentData.patient.species, 'Espécie'],
		[documentData.patient.breed, 'Raça'],
		[documentData.patient.age, 'Idade'],
		[documentData.patient.weight, 'Peso'],
		[documentData.patient.sex, 'Sexo'],
	] as const;

	patientValues.forEach(([value, label], index) => {
		drawInfoCell({
			page,
			x: MARGIN_X + index * (secondRowWidth + secondRowGap),
			y: secondRowY,
			width: secondRowWidth,
			value,
			label,
			font: resources.font,
			boldFont: resources.boldFont,
		});
	});

	drawCenteredText(
		page,
		documentData.isControlled ? 'Receituário Controlado' : 'Receituário',
		PAGE_HEIGHT - 282,
		resources.boldFont,
		documentData.isControlled ? 22 : 24,
	);

	page.drawText(`Emissão: ${formatIssuedDate(issuedAt)}`, {
		x: MARGIN_X,
		y: PAGE_HEIGHT - 302,
		font: resources.font,
		size: 7.5,
		color: rgb(0.25, 0.25, 0.25),
	});
};

const drawFooter = (
	page: PDFPage,
	issuedAt: Date | string,
	signingTime: Date | undefined,
	resources: PageResources,
) => {
	const right = PAGE_WIDTH - MARGIN_X;

	if (signingTime) {
		const boxWidth = 205;
		const boxHeight = 48;
		const boxX = right - boxWidth;
		const boxY = 93;

		page.drawRectangle({
			x: boxX,
			y: boxY,
			width: boxWidth,
			height: boxHeight,
			borderWidth: 0.6,
			borderColor: rgb(0.25, 0.25, 0.25),
		});

		page.drawText('Documento assinado digitalmente', {
			x: boxX + 8,
			y: boxY + 33,
			font: resources.boldFont,
			size: 7.5,
			color: rgb(0, 0, 0),
		});

		page.drawText('M.V. Regina de Oliveira Maciel', {
			x: boxX + 8,
			y: boxY + 21,
			font: resources.font,
			size: 7,
			color: rgb(0, 0, 0),
		});

		page.drawText(`CRMV/MS 9193 - ${formatSigningDate(signingTime)}`, {
			x: boxX + 8,
			y: boxY + 9,
			font: resources.font,
			size: 6.5,
			color: rgb(0.15, 0.15, 0.15),
		});
	} else {
		drawRightText(
			page,
			'M.V. Regina de Oliveira Maciel',
			right,
			123,
			resources.boldFont,
			8.5,
		);

		drawRightText(page, 'CRMV/MS 9193', right, 111, resources.font, 7.5);

		drawRightText(
			page,
			'SIPEAGRO MV00802562025',
			right,
			99,
			resources.font,
			7.5,
		);
	}

	page.drawText(`Campo Grande, ${formatIssuedDate(issuedAt)}.`, {
		x: MARGIN_X,
		y: 74,
		font: resources.font,
		size: 8,
		color: rgb(0, 0, 0),
	});

	page.drawText('WhatsApp: (67) 99120-1007', {
		x: MARGIN_X,
		y: 55,
		font: resources.font,
		size: 8,
		color: rgb(0, 0, 0),
	});
};

const createPrescriptionPage = (
	pdf: PDFDocument,
	documentData: PrescriptionDocumentData,
	issuedAt: Date | string,
	signingTime: Date | undefined,
	resources: PageResources,
): PDFPage => {
	const page = pdf.addPage(PageSizes.A4);

	drawPageDecoration(page, resources);

	drawHeader(page, documentData, issuedAt, resources);

	drawFooter(page, issuedAt, signingTime, resources);

	return page;
};

const drawMedication = ({
	page,
	y,
	name,
	pharmacy,
	quantity,
	orientations,
	resources,
}: {
	page: PDFPage;
	y: number;
	name: string;
	pharmacy: string;
	quantity: string;
	orientations: string;
	resources: PageResources;
}): number => {
	const leftColumnWidth = 190;
	const centerColumnWidth = 170;
	const rightColumnWidth = CONTENT_WIDTH - leftColumnWidth - centerColumnWidth;

	const nameText = fitText(
		name || 'Medicamento',
		resources.boldFont,
		BODY_FONT_SIZE,
		leftColumnWidth - 10,
	);

	const pharmacyText = fitText(
		`(${pharmacy || 'Farmácia veterinária'})`,
		resources.font,
		BODY_FONT_SIZE,
		centerColumnWidth - 10,
	);

	const quantityText = fitText(
		quantity || '---',
		resources.boldFont,
		BODY_FONT_SIZE,
		rightColumnWidth - 5,
	);

	const leftX = MARGIN_X;
	const centerX = leftX + leftColumnWidth;
	const rightX = centerX + centerColumnWidth;

	page.drawText(nameText, {
		x: leftX,
		y,
		font: resources.boldFont,
		size: BODY_FONT_SIZE,
		color: rgb(0, 0, 0),
	});

	const nameWidth = resources.boldFont.widthOfTextAtSize(
		nameText,
		BODY_FONT_SIZE,
	);

	if (leftX + nameWidth + 6 < centerX - 4) {
		page.drawLine({
			start: {
				x: leftX + nameWidth + 6,
				y: y + 1,
			},
			end: {
				x: centerX - 5,
				y: y + 1,
			},
			thickness: 0.6,
			color: rgb(0, 0, 0),
		});
	}

	const pharmacyWidth = resources.font.widthOfTextAtSize(
		pharmacyText,
		BODY_FONT_SIZE,
	);

	page.drawText(pharmacyText, {
		x: centerX + (centerColumnWidth - pharmacyWidth) / 2,
		y,
		font: resources.font,
		size: BODY_FONT_SIZE,
		color: rgb(0, 0, 0),
	});

	const quantityWidth = resources.boldFont.widthOfTextAtSize(
		quantityText,
		BODY_FONT_SIZE,
	);

	page.drawText(quantityText, {
		x: rightX + rightColumnWidth - quantityWidth,
		y,
		font: resources.boldFont,
		size: BODY_FONT_SIZE,
		color: rgb(0, 0, 0),
	});

	if (rightX + 5 < rightX + rightColumnWidth - quantityWidth - 6) {
		page.drawLine({
			start: {
				x: rightX + 5,
				y: y + 1,
			},
			end: {
				x: rightX + rightColumnWidth - quantityWidth - 6,
				y: y + 1,
			},
			thickness: 0.6,
			color: rgb(0, 0, 0),
		});
	}

	const plainOrientations = richTextToPlainText(orientations);

	const lines = wrapText(
		plainOrientations,
		resources.font,
		BODY_FONT_SIZE,
		CONTENT_WIDTH,
	);

	let lineY = y - 16;

	for (const line of lines) {
		if (line) {
			page.drawText(line, {
				x: MARGIN_X,
				y: lineY,
				font: resources.font,
				size: BODY_FONT_SIZE,
				color: rgb(0, 0, 0),
			});
		}

		lineY -= BODY_LINE_HEIGHT;
	}

	return 16 + Math.max(lines.length, 1) * BODY_LINE_HEIGHT + 10;
};

export async function generatePrescriptionPdf({
	documentData,
	issuedAt,
	signingTime,
}: GeneratePrescriptionPdfOptions): Promise<Buffer> {
	const groups = normalizePrescriptionGroups(documentData);

	if (groups.length === 0) {
		throw new Error('A receita não possui medicamentos.');
	}

	const assets = await loadAssets();

	const pdf = await PDFDocument.create();

	const [font, boldFont, logo, paws] = await Promise.all([
		pdf.embedFont(StandardFonts.Helvetica),
		pdf.embedFont(StandardFonts.HelveticaBold),
		pdf.embedPng(assets.logo),
		pdf.embedPng(assets.paws),
	]);

	const resources: PageResources = {
		font,
		boldFont,
		logo,
		paws,
	};

	let page = createPrescriptionPage(
		pdf,
		documentData,
		issuedAt,
		signingTime,
		resources,
	);

	let y = CONTENT_TOP;

	const startNewPage = () => {
		page = createPrescriptionPage(
			pdf,
			documentData,
			issuedAt,
			signingTime,
			resources,
		);

		y = CONTENT_TOP;
	};

	for (const group of groups) {
		if (y < CONTENT_BOTTOM + 45) {
			startNewPage();
		}

		const route = group.administrationRoute.trim().toUpperCase();

		drawCenteredText(page, route, y, boldFont, 11);

		y -= 25;

		for (let itemIndex = 0; itemIndex < group.items.length; itemIndex += 1) {
			const item = group.items[itemIndex];

			const plainOrientations = richTextToPlainText(item.orientations);

			const orientationLines = wrapText(
				plainOrientations,
				font,
				BODY_FONT_SIZE,
				CONTENT_WIDTH,
			);

			const estimatedHeight =
				16 + Math.max(orientationLines.length, 1) * BODY_LINE_HEIGHT + 10;

			if (y - estimatedHeight < CONTENT_BOTTOM) {
				startNewPage();

				drawCenteredText(page, route, y, boldFont, 11);

				y -= 25;
			}

			const usedHeight = drawMedication({
				page,
				y,
				name: item.name,
				pharmacy: item.pharmacy,
				quantity: item.quantity,
				orientations: item.orientations,
				resources,
			});

			y -= usedHeight;
		}

		y -= 12;
	}

	pdf.setCreator('LovelyVet');
	pdf.setProducer('LovelyVet');
	pdf.setTitle(`Receita - ${documentData.patient.name}`);
	pdf.setSubject(
		documentData.isControlled
			? 'Receita veterinária controlada'
			: 'Receita veterinária',
	);

	const bytes = await pdf.save({
		useObjectStreams: true,
	});

	return Buffer.from(bytes);
}

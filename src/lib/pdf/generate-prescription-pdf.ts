import type { PrescriptionDocumentData } from '@/api/schema/prescription-document.schema';
import { normalizePrescriptionGroups } from '@/lib/prescriptions/normalize-prescription-groups';
import {
	parseRichTextHtml,
	type RichTextAlignment,
} from '@/lib/pdf/rich-text';
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

interface PrescriptionPdfValidation {
	url: string;
	qrCode: Buffer;
	token: string;
}

interface GeneratePrescriptionPdfOptions {
	documentData: PrescriptionDocumentData;
	issuedAt: Date | string;
	signingTime?: Date;
	validation?: PrescriptionPdfValidation;
}

interface PrescriptionPdfAssets {
	logo: Buffer;
	paws: Buffer;
}

interface PageResources {
	font: PDFFont;
	boldFont: PDFFont;
	italicFont: PDFFont;
	boldItalicFont: PDFFont;
	logo: PDFImage;
	paws: PDFImage;
	validationQrCode?: PDFImage;
	validationToken?: string;
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

interface StyledTextFragment {
	text: string;
	font: PDFFont;
	width: number;
}

interface StyledTextLine {
	fragments: StyledTextFragment[];
	width: number;
	alignment: RichTextAlignment;
}

const getRichTextFont = (
	resources: PageResources,
	bold: boolean,
	italic: boolean,
): PDFFont => {
	if (bold && italic) return resources.boldItalicFont;
	if (bold) return resources.boldFont;
	if (italic) return resources.italicFont;
	return resources.font;
};

const layoutRichText = (
	html: string,
	resources: PageResources,
	fontSize: number,
	maxWidth: number,
): StyledTextLine[] => {
	const lines: StyledTextLine[] = [];

	for (const paragraph of parseRichTextHtml(html)) {
		let fragments: StyledTextFragment[] = [];
		let lineWidth = 0;
		let pendingSpace = false;

		const finishLine = () => {
			if (fragments.length > 0) {
				lines.push({ fragments, width: lineWidth, alignment: paragraph.alignment });
			}
			fragments = [];
			lineWidth = 0;
			pendingSpace = false;
		};

		for (const run of paragraph.runs) {
			const font = getRichTextFont(resources, run.bold, run.italic);

			for (const part of run.text.split(/(\s+)/).filter(Boolean)) {
				if (part.includes('\n')) {
					finishLine();
					continue;
				}

				if (/^\s+$/.test(part)) {
					pendingSpace = fragments.length > 0;
					continue;
				}

				const prefix = pendingSpace ? ' ' : '';
				let text = `${prefix}${part}`;
				let width = font.widthOfTextAtSize(text, fontSize);

				if (fragments.length > 0 && lineWidth + width > maxWidth) {
					finishLine();
					text = part;
					width = font.widthOfTextAtSize(text, fontSize);
				}

				fragments.push({ text, font, width });
				lineWidth += width;
				pendingSpace = false;
			}
		}

		finishLine();
	}

	return lines;
};

const drawRichText = ({
	page,
	html,
	y,
	resources,
}: {
	page: PDFPage;
	html: string;
	y: number;
	resources: PageResources;
}): number => {
	const lines = layoutRichText(html, resources, BODY_FONT_SIZE, CONTENT_WIDTH);
	let lineY = y;

	for (const line of lines) {
		let x = MARGIN_X;

		if (line.alignment === 'center') {
			x += (CONTENT_WIDTH - line.width) / 2;
		} else if (line.alignment === 'right') {
			x += CONTENT_WIDTH - line.width;
		}

		for (const fragment of line.fragments) {
			page.drawText(fragment.text, {
				x,
				y: lineY,
				font: fragment.font,
				size: BODY_FONT_SIZE,
				color: rgb(0, 0, 0),
			});
			x += fragment.width;
		}

		lineY -= BODY_LINE_HEIGHT;
	}

	return Math.max(lines.length, 1) * BODY_LINE_HEIGHT;
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

	/*
	page.drawText(
		`Emissão: ${formatIssuedDate(
			issuedAt,
		)}`,
		{
			x: MARGIN_X,
			y: PAGE_HEIGHT - 302,
			font:
				resources.font,
			size: 7.5,
			color: rgb(
				0.25,
				0.25,
				0.25,
			),
		},
	);
	*/

	void issuedAt;
};

const drawValidationQrCode = (page: PDFPage, resources: PageResources) => {
	if (!resources.validationQrCode) {
		return;
	}

	/*
	 * O QR fica à esquerda do bloco
	 * visual de assinatura.
	 *
	 * Ele não substitui a assinatura
	 * atual.
	 */
	const qrSize = 58;
	const qrX = MARGIN_X;
	const qrY = 91;

	page.drawImage(resources.validationQrCode, {
		x: qrX,
		y: qrY,
		width: qrSize,
		height: qrSize,
	});

	const textX = qrX + qrSize + 8;

	page.drawText('Este documento foi assinado digitalmente.', {
		x: textX,
		y: qrY + 46,
		font: resources.boldFont,
		size: 7,
		color: rgb(0, 0, 0),
	});

	page.drawText('Escaneie o QR Code para validar no LovelyVet.', {
		x: textX,
		y: qrY + 34,
		font: resources.font,
		size: 6.3,
		color: rgb(0.1, 0.1, 0.1),
	});

	page.drawText(`TOKEN: ${resources.validationToken ?? '-'}`, {
		x: textX,
		y: qrY + 22,
		font: resources.boldFont,
		size: 7,
		color: rgb(0.1, 0.1, 0.1),
	});

	page.drawText('Confira a assinatura criptográfica em:', {
		x: textX,
		y: qrY + 10,
		font: resources.font,
		size: 6.3,
		color: rgb(0.3, 0.3, 0.3),
	});

	page.drawText('https://validar.iti.gov.br', {
		x: textX,
		y: qrY,
		font: resources.boldFont,
		size: 6.3,
		color: rgb(0.05, 0.25, 0.65),
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
		drawValidationQrCode(page, resources);

		const signatureRight = PAGE_WIDTH - 108;

		drawRightText(
			page,
			'M.V. Regina de Oliveira Maciel',
			signatureRight,
			154,
			resources.boldFont,
			8.5,
		);
		drawRightText(
			page,
			'CRMV/MS 9193',
			signatureRight,
			142,
			resources.font,
			7.5,
		);
		drawRightText(
			page,
			'SIPEAGRO MV00802562025',
			signatureRight,
			130,
			resources.font,
			7.5,
		);
		drawRightText(
			page,
			`Assinado em ${formatSigningDate(signingTime)}`,
			signatureRight,
			118,
			resources.font,
			6.2,
		);
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
		y: 66,
		font: resources.font,
		size: 8,
		color: rgb(0, 0, 0),
	});

	page.drawText('WhatsApp: (67) 99120-1007', {
		x: MARGIN_X,
		y: 49,
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
	const leftColumnWidth = 230;
	const rightColumnWidth = 72;
	const centerColumnWidth = CONTENT_WIDTH - leftColumnWidth - rightColumnWidth;

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

	const pharmacyWidth = resources.font.widthOfTextAtSize(
		pharmacyText,
		BODY_FONT_SIZE,
	);
	const pharmacyX = centerX + (centerColumnWidth - pharmacyWidth) / 2;

	if (leftX + nameWidth + 6 < pharmacyX - 6) {
		page.drawLine({
			start: {
				x: leftX + nameWidth + 6,
				y: y + 1,
			},
			end: {
				x: pharmacyX - 6,
				y: y + 1,
			},
			thickness: 0.6,
			color: rgb(0, 0, 0),
		});
	}

	page.drawText(pharmacyText, {
		x: pharmacyX,
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

	const pharmacyEndX = pharmacyX + pharmacyWidth;
	const quantityX = rightX + rightColumnWidth - quantityWidth;

	if (pharmacyEndX + 6 < quantityX - 6) {
		page.drawLine({
			start: {
				x: pharmacyEndX + 6,
				y: y + 1,
			},
			end: {
				x: quantityX - 6,
				y: y + 1,
			},
			thickness: 0.6,
			color: rgb(0, 0, 0),
		});
	}

	const richTextHeight = drawRichText({
		page,
		html: orientations,
		y: y - 16,
		resources,
	});

	return 16 + richTextHeight + 10;
};

export async function generatePrescriptionPdf({
	documentData,
	issuedAt,
	signingTime,
	validation,
}: GeneratePrescriptionPdfOptions): Promise<Buffer> {
	const groups = normalizePrescriptionGroups(documentData);

	if (groups.length === 0) {
		throw new Error('A receita não possui medicamentos.');
	}

	const assets = await loadAssets();

	const pdf = await PDFDocument.create();

	const [font, boldFont, italicFont, boldItalicFont, logo, paws] =
		await Promise.all([
		pdf.embedFont(StandardFonts.Helvetica),
		pdf.embedFont(StandardFonts.HelveticaBold),
		pdf.embedFont(StandardFonts.HelveticaOblique),
		pdf.embedFont(StandardFonts.HelveticaBoldOblique),
		pdf.embedPng(assets.logo),
		pdf.embedPng(assets.paws),
		]);

	/*
	 * O QR é incorporado ao PDF antes
	 * de signPrescriptionPdf().
	 *
	 * Dessa forma, o QR também faz
	 * parte dos bytes protegidos pela
	 * assinatura criptográfica.
	 */
	const validationQrCode = validation
		? await pdf.embedPng(validation.qrCode)
		: undefined;

	const resources: PageResources = {
		font,
		boldFont,
		italicFont,
		boldItalicFont,
		logo,
		paws,
		validationQrCode,
		validationToken: validation?.token,
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
			const orientationLines = layoutRichText(
				item.orientations,
				resources,
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

	if (validation) {
		pdf.setKeywords([
			'LovelyVet',
			'receita veterinária',
			'assinatura digital',
			'validação',
			validation.url,
		]);
	}

	const bytes = await pdf.save({
		useObjectStreams: true,
	});

	return Buffer.from(bytes);
}

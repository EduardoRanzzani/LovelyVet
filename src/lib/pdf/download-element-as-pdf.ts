'use client';

const A4_WIDTH_PX = Math.round(210 * (96 / 25.4));
const A4_HEIGHT_PX = Math.round(297 * (96 / 25.4));

interface DownloadElementAsPdfOptions {
	element: HTMLElement;
	filename: string;
}

async function waitForImages(element: HTMLElement) {
	const images = Array.from(element.querySelectorAll('img'));

	await Promise.all(
		images.map(async (image) => {
			if (!image.complete) {
				await new Promise<void>((resolve) => {
					image.addEventListener('load', () => resolve(), { once: true });
					image.addEventListener('error', () => resolve(), { once: true });
				});
			}

			await image.decode?.().catch(() => undefined);
		}),
	);
}

export async function downloadElementAsPdf({
	element,
	filename,
}: DownloadElementAsPdfOptions) {
	await document.fonts.ready;
	await waitForImages(element);

	const [{ toJpeg }, { PDFDocument, PageSizes }] = await Promise.all([
		import('html-to-image'),
		import('pdf-lib'),
	]);

	const image = await toJpeg(element, {
		backgroundColor: '#ffffff',
		cacheBust: true,
		includeQueryParams: true,
		height: A4_HEIGHT_PX,
		pixelRatio: 3,
		quality: 0.96,
		style: {
			boxShadow: 'none',
			height: `${A4_HEIGHT_PX}px`,
			margin: '0',
			maxWidth: 'none',
			overflow: 'hidden',
			transform: 'none',
			width: `${A4_WIDTH_PX}px`,
		},
		width: A4_WIDTH_PX,
	});

	const title = filename.replace(/\.pdf$/i, '');
	const pdf = await PDFDocument.create();
	const jpeg = await pdf.embedJpg(await (await fetch(image)).arrayBuffer());
	const page = pdf.addPage(PageSizes.A4);

	pdf.setCreator('LovelyVet');
	pdf.setTitle(title);

	page.drawImage(jpeg, {
		height: page.getHeight(),
		width: page.getWidth(),
		x: 0,
		y: 0,
	});

	const bytes = await pdf.save({ useObjectStreams: true });
	const buffer = new ArrayBuffer(bytes.byteLength);

	new Uint8Array(buffer).set(bytes);

	const url = URL.createObjectURL(
		new Blob([buffer], { type: 'application/pdf' }),
	);
	const link = document.createElement('a');

	link.href = url;
	link.download = filename.toLowerCase().endsWith('.pdf')
		? filename
		: `${filename}.pdf`;
	document.body.append(link);
	link.click();
	link.remove();

	window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

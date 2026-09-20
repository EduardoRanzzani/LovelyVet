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

function blobToDataUrl(blob: Blob) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();

		reader.addEventListener('load', () => {
			if (typeof reader.result === 'string') {
				resolve(reader.result);
				return;
			}

			reject(new Error('Não foi possível converter a imagem.'));
		});

		reader.addEventListener('error', () => reject(reader.error));
		reader.readAsDataURL(blob);
	});
}

async function inlineImages(element: HTMLElement) {
	const images = Array.from(element.querySelectorAll('img'));
	const originals = images.map((image) => ({
		image,
		src: image.getAttribute('src'),
		srcset: image.getAttribute('srcset'),
	}));

	const dataUrls = new Map<string, Promise<string>>();

	await Promise.all(
		images.map(async (image) => {
			const source = image.currentSrc || image.src;

			if (!source || source.startsWith('data:')) {
				return;
			}

			let dataUrl = dataUrls.get(source);

			if (!dataUrl) {
				dataUrl = fetch(source, {
					credentials: 'same-origin',
				}).then(async (response) => {
					if (!response.ok) {
						throw new Error(`Não foi possível carregar a imagem: ${source}`);
					}

					return blobToDataUrl(await response.blob());
				});

				dataUrls.set(source, dataUrl);
			}

			image.removeAttribute('srcset');
			image.src = await dataUrl;
			await image.decode?.().catch(() => undefined);
		}),
	);

	return () => {
		for (const original of originals) {
			if (original.src === null) {
				original.image.removeAttribute('src');
			} else {
				original.image.setAttribute('src', original.src);
			}

			if (original.srcset === null) {
				original.image.removeAttribute('srcset');
			} else {
				original.image.setAttribute('srcset', original.srcset);
			}
		}
	};
}

export async function downloadElementAsPdf({
	element,
	filename,
}: DownloadElementAsPdfOptions) {
	await document.fonts.ready;
	await waitForImages(element);

	const restoreImages = await inlineImages(element);

	try {
		const [{ toJpeg }, { PDFDocument, PageSizes }] = await Promise.all([
			import('html-to-image'),
			import('pdf-lib'),
		]);

		const image = await toJpeg(element, {
			backgroundColor: '#ffffff',
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
		const jpegBytes = await fetch(image).then((response) =>
			response.arrayBuffer(),
		);
		const jpeg = await pdf.embedJpg(jpegBytes);
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
	} finally {
		restoreImages();
	}
}

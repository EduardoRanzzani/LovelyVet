'use client';

const A4_WIDTH_PX = Math.round(210 * (96 / 25.4));
const A4_HEIGHT_PX = Math.round(297 * (96 / 25.4));

function waitForNextPaint() {
	return new Promise<void>((resolve) => {
		requestAnimationFrame(() => {
			requestAnimationFrame(() => resolve());
		});
	});
}

function forceA4Layout(element: HTMLElement) {
	const originalStyle = element.getAttribute('style');

	element.style.width = `${A4_WIDTH_PX}px`;
	element.style.minWidth = `${A4_WIDTH_PX}px`;
	element.style.maxWidth = `${A4_WIDTH_PX}px`;

	element.style.height = `${A4_HEIGHT_PX}px`;
	element.style.minHeight = `${A4_HEIGHT_PX}px`;
	element.style.maxHeight = `${A4_HEIGHT_PX}px`;

	element.style.boxSizing = 'border-box';
	element.style.flex = '0 0 auto';
	element.style.transform = 'none';

	// Força o navegador a recalcular o layout imediatamente.
	void element.offsetWidth;

	return () => {
		if (originalStyle === null) {
			element.removeAttribute('style');
			return;
		}

		element.setAttribute('style', originalStyle);
	};
}

interface DownloadElementAsPdfOptions {
	element: HTMLElement;
	filename: string;
}

async function waitForImages(element: HTMLElement) {
	const images = Array.from(element.querySelectorAll('img'));

	await Promise.all(
		images.map(async (image) => {
			image.loading = 'eager';

			if (!image.complete) {
				await new Promise<void>((resolve, reject) => {
					const timeout = window.setTimeout(() => {
						cleanup();

						reject(
							new Error(
								`Tempo esgotado ao carregar imagem: ${
									image.currentSrc || image.src || 'desconhecida'
								}`,
							),
						);
					}, 10_000);

					const handleLoad = () => {
						cleanup();
						resolve();
					};

					const handleError = () => {
						cleanup();

						reject(
							new Error(
								`Não foi possível carregar imagem: ${
									image.currentSrc || image.src || 'desconhecida'
								}`,
							),
						);
					};

					const cleanup = () => {
						window.clearTimeout(timeout);

						image.removeEventListener('load', handleLoad);
						image.removeEventListener('error', handleError);
					};

					image.addEventListener('load', handleLoad, {
						once: true,
					});

					image.addEventListener('error', handleError, {
						once: true,
					});
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
			image.removeAttribute('sizes');

			image.loading = 'eager';
			image.decoding = 'sync';

			image.src = await dataUrl;

			if (!image.complete || image.naturalWidth === 0) {
				await new Promise<void>((resolve, reject) => {
					const timeout = window.setTimeout(() => {
						cleanup();

						reject(
							new Error(
								`Tempo esgotado ao preparar imagem: ${
									image.src || 'desconhecida'
								}`,
							),
						);
					}, 10_000);

					const handleLoad = () => {
						cleanup();
						resolve();
					};

					const handleError = () => {
						cleanup();

						reject(
							new Error(
								`Não foi possível preparar imagem: ${
									image.src || 'desconhecida'
								}`,
							),
						);
					};

					const cleanup = () => {
						window.clearTimeout(timeout);

						image.removeEventListener('load', handleLoad);
						image.removeEventListener('error', handleError);
					};

					image.addEventListener('load', handleLoad, {
						once: true,
					});

					image.addEventListener('error', handleError, {
						once: true,
					});
				});
			}

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
	const restoreLayout = forceA4Layout(element);

	let restoreImages: (() => void) | undefined;

	try {
		/*
		 * Importante principalmente no mobile:
		 * damos tempo para o browser recalcular grids, flexbox,
		 * porcentagens e posições após transformar o elemento em A4.
		 */
		await waitForNextPaint();

		await document.fonts.ready;
		await waitForImages(element);

		restoreImages = await inlineImages(element);

		/*
		 * A troca das imagens por data URLs também pode provocar
		 * uma nova passagem de layout.
		 */
		await waitForNextPaint();

		const [{ toJpeg }, { PDFDocument, PageSizes }] = await Promise.all([
			import('html-to-image'),
			import('pdf-lib'),
		]);

		const pixelRatio = window.matchMedia('(max-width: 768px)').matches ? 2 : 3;

		const captureOptions = {
			backgroundColor: '#ffffff',
			cacheBust: true,
			height: A4_HEIGHT_PX,
			quality: 0.96,

			style: {
				boxShadow: 'none',

				width: `${A4_WIDTH_PX}px`,
				minWidth: `${A4_WIDTH_PX}px`,
				maxWidth: `${A4_WIDTH_PX}px`,

				height: `${A4_HEIGHT_PX}px`,
				minHeight: `${A4_HEIGHT_PX}px`,
				maxHeight: `${A4_HEIGHT_PX}px`,

				margin: '0',
				overflow: 'hidden',
				transform: 'none',
			},

			width: A4_WIDTH_PX,
		};

		const isMobileDevice =
			window.matchMedia('(pointer: coarse)').matches ||
			window.matchMedia('(max-width: 768px)').matches;

		/*
		 * Em navegadores móveis reais, especialmente WebKit/iOS,
		 * html-to-image pode não rasterizar as imagens corretamente
		 * na primeira chamada.
		 *
		 * Fazemos uma captura barata apenas para aquecer o renderer
		 * e descartamos o resultado.
		 */
		if (isMobileDevice) {
			await toJpeg(element, {
				...captureOptions,
				pixelRatio: 1,
				quality: 0.8,
			});

			await waitForNextPaint();

			/*
			 * Confirma novamente que os <img> continuam carregados
			 * antes da captura definitiva.
			 */
			await waitForImages(element);
		}

		const image = await toJpeg(element, {
			...captureOptions,
			pixelRatio,
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

		const bytes = await pdf.save({
			useObjectStreams: true,
		});

		const buffer = new ArrayBuffer(bytes.byteLength);

		new Uint8Array(buffer).set(bytes);

		const url = URL.createObjectURL(
			new Blob([buffer], {
				type: 'application/pdf',
			}),
		);

		const link = document.createElement('a');

		link.href = url;

		link.download = filename.toLowerCase().endsWith('.pdf')
			? filename
			: `${filename}.pdf`;

		document.body.append(link);

		link.click();

		link.remove();

		window.setTimeout(() => {
			URL.revokeObjectURL(url);
		}, 60_000);
	} finally {
		restoreImages?.();
		restoreLayout();
	}
}

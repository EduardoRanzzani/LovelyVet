'use client';

import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentLoadingTask, RenderTask } from 'pdfjs-dist';

export function PrescriptionPdfViewer({ url }: { url: string }) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		let disposed = false;
		let loadingTask: PDFDocumentLoadingTask | undefined;
		let renderTask: RenderTask | undefined;

		async function renderPdf() {
			try {
				const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
				if (disposed) return;

				pdfjs.GlobalWorkerOptions.workerSrc = new URL(
					'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
					import.meta.url,
				).toString();

				loadingTask = pdfjs.getDocument({ url });
				const pdf = await loadingTask.promise;
				for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
					if (disposed) return;
					const page = await pdf.getPage(pageNumber);
					if (disposed) return;
					const viewport = page.getViewport({ scale: 1 });
					const scale =
						(900 / viewport.width) * Math.min(window.devicePixelRatio || 1, 2);
					const scaledViewport = page.getViewport({ scale });
					const canvas = document.createElement('canvas');
					canvas.width = Math.ceil(scaledViewport.width);
					canvas.height = Math.ceil(scaledViewport.height);
					canvas.className = 'block h-auto w-full bg-white shadow-sm';
					canvas.setAttribute('role', 'img');
					canvas.setAttribute(
						'aria-label',
						`Página ${pageNumber} de ${pdf.numPages} da receita`,
					);
					container?.appendChild(canvas);
					renderTask = page.render({ canvas, viewport: scaledViewport });
					await renderTask.promise;
					page.cleanup();
				}
				if (!disposed) setStatus('ready');
			} catch {
				if (!disposed) setStatus('error');
			}
		}

		void renderPdf();
		return () => {
			disposed = true;
			renderTask?.cancel();
			void loadingTask?.destroy();
			container.replaceChildren();
		};
	}, [url]);

	return (
		<>
			{status === 'loading' && <p role='status'>Carregando receita…</p>}
			{status === 'error' && (
				<p role='alert'>
					Não foi possível exibir a receita. Atualize a página para tentar novamente.
				</p>
			)}
			<div
				ref={containerRef}
				className='space-y-4'
				aria-label='Páginas da receita'
			/>
		</>
	);
}

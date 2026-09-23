import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrescriptionPdfViewer } from './prescription-pdf-viewer';

const { getDocument, destroy, renderPage, cleanup } = vi.hoisted(() => ({
	getDocument: vi.fn(),
	destroy: vi.fn(),
	renderPage: vi.fn(),
	cleanup: vi.fn(),
}));

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
	GlobalWorkerOptions: {},
	getDocument,
}));

beforeEach(() => {
	renderPage.mockImplementation(() => ({ promise: Promise.resolve(), cancel: vi.fn() }));
	getDocument.mockReturnValue({
		destroy,
		promise: Promise.resolve({
			numPages: 2,
			getPage: async () => ({
				getViewport: ({ scale }: { scale: number }) => ({ width: 600 * scale, height: 800 * scale }),
				render: renderPage,
				cleanup,
			}),
		}),
	});
});

describe('prescription viewer', () => {
	it('renders every page in canvas without embedding or navigating to a PDF', async () => {
		const { container, unmount } = render(<PrescriptionPdfViewer url='/receitas/validar/id/pdf?raw=1' />);
		await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
		expect(screen.getAllByRole('img')).toHaveLength(2);
		expect(renderPage).toHaveBeenCalledTimes(2);
		expect(getDocument).toHaveBeenCalledWith({ url: '/receitas/validar/id/pdf?raw=1' });
		expect(container.querySelector('iframe, object, embed, a[download]')).toBeNull();
		unmount();
		expect(destroy).toHaveBeenCalledTimes(1);
	});

	it('shows a readable error when the PDF cannot be loaded', async () => {
		getDocument.mockImplementation(() => {
			throw new Error('PDF unavailable');
		});
		render(<PrescriptionPdfViewer url='/receitas/validar/missing/pdf?raw=1' />);
		expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível exibir a receita');
	});
});

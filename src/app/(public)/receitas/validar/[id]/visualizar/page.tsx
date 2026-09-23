import { PrescriptionPdfViewer } from './prescription-pdf-viewer';

export default async function PrescriptionPdfViewerPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	return (
		<main className='min-h-screen bg-muted px-3 py-6 sm:px-6'>
			<div className='mx-auto max-w-4xl space-y-4'>
				<h1 className='text-xl font-semibold'>Receita assinada</h1>
				<PrescriptionPdfViewer
					key={id}
					url={`/receitas/validar/${encodeURIComponent(id)}/pdf?raw=1`}
				/>
			</div>
		</main>
	);
}

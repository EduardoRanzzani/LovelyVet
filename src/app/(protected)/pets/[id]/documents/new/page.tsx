interface NewClinicalDocumentPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function NewClinicalDocumentPage({
	params,
}: NewClinicalDocumentPageProps) {
	const { id } = await params;

	return (
		<div className='p-6'>
			<h1 className='text-2xl font-bold'>Nova Receita / Encaminhamento</h1>

			<p className='mt-2 text-muted-foreground'>Pet: {id}</p>
		</div>
	);
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

interface DownloadPdfButtonProps {
	recipeId: string;
}

export function DownloadPdfButton({ recipeId }: DownloadPdfButtonProps) {
	const [loading, setLoading] = useState(false);

	const handleDownload = async () => {
		try {
			setLoading(true);

			const response = await fetch(`/api/prescriptions/${recipeId}/pdf`);

			if (!response.ok) {
				throw new Error('Falha ao gerar o arquivo PDF.');
			}

			const contentType = response.headers.get('content-type');
			if (contentType && contentType.includes('text/html')) {
				throw new Error(
					'A requisição foi redirecionada para HTML. Verifique a chave de autenticação.',
				);
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);

			const a = document.createElement('a');
			a.href = url;
			a.download = `receita-${recipeId}.pdf`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			window.URL.revokeObjectURL(url);
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : 'Erro ao baixar receita.';
			console.error(error);
			toast.error(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Button
			onClick={handleDownload}
			disabled={loading}
			variant='outline'
			size='sm'
		>
			{loading ? (
				<Loader2Icon className='w-4 h-4 mr-2 animate-spin' />
			) : (
				<FileIcon className='w-4 h-4 mr-2' />
			)}
			Download
		</Button>
	);
}

import { FileCheck2Icon } from 'lucide-react';
import PrescriptionTokenForm from './token-form';

export default function PrescriptionValidationStartPage() {
	return (
		<main className='min-h-screen bg-muted/40 px-4 py-10'>
			<div className='mx-auto max-w-2xl'>
				<div className='rounded-2xl border bg-background p-6 shadow-sm sm:p-8'>
					<div className='flex items-start gap-4'>
						<div className='flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10'>
							<FileCheck2Icon className='size-6 text-primary' />
						</div>

						<div>
							<h1 className='text-xl font-semibold'>Validar receita</h1>
							<p className='mt-2 text-sm leading-6 text-muted-foreground'>
								Digite o token exibido no PDF assinado para consultar o
								registro e verificar a integridade do documento.
							</p>
						</div>
					</div>

					<PrescriptionTokenForm />

					<p className='mt-6 text-xs leading-5 text-muted-foreground'>
						A validação criptográfica completa do PDF também está disponível
						no{' '}
						<a
							href='https://validar.iti.gov.br/'
							target='_blank'
							rel='noreferrer'
							className='font-medium underline'
						>
							VALIDAR do ITI
						</a>
						.
					</p>
				</div>
			</div>
		</main>
	);
}

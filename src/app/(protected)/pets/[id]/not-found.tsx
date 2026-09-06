import { Button } from '@/components/ui/button';
import { ArrowLeft, PawPrint } from 'lucide-react';
import Link from 'next/link';

export default function PetNotFound() {
	return (
		<div className='flex min-h-[60vh] items-center justify-center px-4'>
			<div className='flex max-w-md flex-col items-center text-center'>
				<div className='mb-6 flex size-16 items-center justify-center rounded-full bg-muted'>
					<PawPrint className='size-8 text-muted-foreground' />
				</div>

				<h1 className='text-2xl font-semibold'>Pet não encontrado</h1>

				<p className='mt-2 text-muted-foreground'>
					Não encontramos este pet ou você não possui acesso a ele.
				</p>

				<Button asChild className='mt-6'>
					<Link href='/pets'>
						<ArrowLeft className='mr-2 size-4' />
						Voltar para meus pets
					</Link>
				</Button>
			</div>
		</div>
	);
}

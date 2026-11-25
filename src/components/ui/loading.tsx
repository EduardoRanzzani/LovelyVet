'use client';

import { Loader2Icon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';

const LoadingDialog = () => {
	return (
		<Dialog open={true}>
			<DialogContent onInteractOutside={(e) => e.preventDefault()} showCloseButton={false} className='max-w-lg'>
				<DialogHeader>
					<DialogTitle className='text-center animate-pulse'>Aguarde...</DialogTitle>
				</DialogHeader>

				<div className='flex flex-row gap-4 w-full animate-pulse my-2'>
					<Loader2Icon className='animate-spin' />
					Carregando, aguarde...
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default LoadingDialog;

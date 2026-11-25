'use client';

import { queryClient } from '@/lib/tanstack-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { setDefaultOptions } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ReactNode, useEffect } from 'react';
import { Toaster } from '../ui/sonner';
import { TooltipProvider } from '../ui/tooltip';

type ClientProvidersProps = {
	children: ReactNode;
};

export const ClientProviders = ({ children }: ClientProvidersProps) => {
	useEffect(() => {
		setDefaultOptions({ locale: ptBR });
	}, []);

	return (
		<QueryClientProvider client={queryClient}>
			<Toaster closeButton={false} position='bottom-center' richColors theme='light' />
			<TooltipProvider>{children}</TooltipProvider>
		</QueryClientProvider>
	);
};

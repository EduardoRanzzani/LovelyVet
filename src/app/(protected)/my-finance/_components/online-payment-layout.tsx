import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	PageContainer,
	PageContent,
	PageHeader,
	PageHeaderContent,
	PageTitle,
} from '@/components/shared/page-container';

export function OnlinePaymentLayout({
	summary,
	children,
	returnHref,
	approved = false,
}: {
	summary?: ReactNode;
	children: ReactNode;
	returnHref: string;
	approved?: boolean;
}) {
	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>{approved ? 'Confirmação de pagamento' : 'Realizar pagamento'}</PageTitle>
				</PageHeaderContent>
			</PageHeader>
			<PageContent>
				{approved ? (
					<div className='w-full min-w-0 rounded-xl border bg-card p-4 shadow-sm sm:p-6'>{children}</div>
				) : (
					<div className='w-full min-w-0 space-y-4'>
						<Button asChild variant='ghost' className='w-fit'>
							<Link href={returnHref}>
								<ArrowLeft /> Voltar ao meu financeiro
							</Link>
						</Button>
						<div className='grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-6'>
							{summary}
							<section
								aria-label='Pagamento online'
								className='min-w-0 space-y-4 rounded-xl border bg-card p-4 shadow-sm sm:p-6 lg:col-start-1 lg:row-start-1'
							>
								<h2 className='text-lg font-semibold'>Forma de pagamento</h2>
								<p className='text-sm text-muted-foreground'>
									Pagamento via Mercado Pago. A situação é atualizada automaticamente.
								</p>
								{children}
							</section>
						</div>
					</div>
				)}
			</PageContent>
		</PageContainer>
	);
}

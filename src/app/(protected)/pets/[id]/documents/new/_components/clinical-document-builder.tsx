'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileTextIcon, PrinterIcon, StethoscopeIcon } from 'lucide-react';

export default function ClinicalDocumentBuilder() {
	return (
		<div className='mt-6'>
			<Tabs defaultValue='prescription'>
				<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
					<TabsList>
						<TabsTrigger value='prescription'>
							<FileTextIcon className='size-4' />
							Receita
						</TabsTrigger>

						<TabsTrigger value='referral'>
							<StethoscopeIcon className='size-4' />
							Encaminhamento
						</TabsTrigger>
					</TabsList>

					<Button type='button' variant='outline' disabled>
						<PrinterIcon className='size-4' />
						Imprimir
					</Button>
				</div>

				<TabsContent value='prescription' className='mt-6'>
					<div className='rounded-xl border bg-card p-6'>
						<div className='mb-6'>
							<h2 className='text-lg font-semibold'>Receita</h2>

							<p className='text-sm text-muted-foreground'>
								Adicione os medicamentos e as orientações da receita.
							</p>
						</div>

						<div className='flex min-h-64 items-center justify-center rounded-lg border border-dashed'>
							<p className='text-sm text-muted-foreground'>
								Os itens da receita serão adicionados aqui.
							</p>
						</div>
					</div>
				</TabsContent>

				<TabsContent value='referral' className='mt-6'>
					<div className='rounded-xl border bg-card p-6'>
						<div className='mb-6'>
							<h2 className='text-lg font-semibold'>Encaminhamento</h2>

							<p className='text-sm text-muted-foreground'>
								Preencha as informações necessárias para o encaminhamento.
							</p>
						</div>

						<div className='flex min-h-64 items-center justify-center rounded-lg border border-dashed'>
							<p className='text-sm text-muted-foreground'>
								O formulário de encaminhamento será adicionado aqui.
							</p>
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

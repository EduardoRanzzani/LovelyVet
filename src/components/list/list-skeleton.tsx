// components/list/species-table-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const ListSkeleton = () => {
	return (
		<div className='flex flex-col w-full gap-4'>
			{/* Skeleton para a barra de busca e botão */}
			<div className='flex flex-col lg:flex-row items-center justify-between gap-4'>
				<Skeleton className='h-9 w-full lg:max-w-100 bg-zinc-100' />
				<Skeleton className='h-9 w-60 bg-zinc-100' />
			</div>

			{/* Estrutura da Tabela simulada */}
			<div className='rounded-md border'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>
								<Skeleton className='h-4 w-32 bg-zinc-100' />
							</TableHead>
							<TableHead className='w-20'>
								<Skeleton className='h-4 w-16 bg-zinc-100' />
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{/* Gerar 5 linhas de esqueleto */}
						{Array.from({ length: 5 }).map((_, i) => (
							<TableRow key={i}>
								<TableCell>
									<Skeleton className='h-4 w-full bg-zinc-100' />
								</TableCell>
								<TableCell className='flex flex-row gap-2'>
									<Skeleton className='h-8 w-10 bg-zinc-100' />
									<Skeleton className='h-8 w-10 bg-zinc-100' />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
};

// components/skeletons/pet-details-skeleton.tsx
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export const PetDetailsSkeleton = () => {
	return (
		<div className='flex flex-col gap-4 w-full'>
			<div className='flex flex-col md:flex-row gap-4 w-full'>
				{/* Lado Esquerdo: Avatar e Nome */}
				<div className='flex flex-col items-center justify-start gap-4 p-5 w-full lg:min-w-2xs lg:w-1/3 border border-muted rounded-lg'>
					{/* Círculo da Foto */}
					<Skeleton className='rounded-full w-50 h-50 bg-zinc-100' />

					<div className='flex flex-col items-center gap-2 w-full'>
						<Skeleton className='h-8 w-3/4 bg-zinc-100' />
						<Skeleton className='h-4 w-1/2 bg-zinc-100' />
					</div>
				</div>

				{/* Lado Direito: Dados Cadastrais */}
				<div className='flex flex-col gap-4 p-5 w-full lg:w-2/3 border border-muted rounded-lg'>
					<span className='flex flex-row items-center justify-center gap-3'>
						<Skeleton className='h-8 w-48 bg-zinc-100' />
						<Skeleton className='h-8 w-8 rounded-md bg-zinc-100' />
					</span>

					<Separator className='text-muted' />

					<div className='grid grid-cols-1 xl:grid-cols-2 mb-3 gap-4 w-full'>
						{/* Gerando 5 campos de informação simulados */}
						{Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className='flex flex-col gap-1'>
								<Skeleton className='h-4 w-full bg-zinc-100' />
							</div>
						))}
					</div>
				</div>
			</div>

			<div className='flex flex-col gap-4 p-5 w-full border border-muted rounded-lg'>
				<span className='flex flex-row items-center gap-3'>
					<Skeleton className='h-8 w-48 bg-zinc-100' />
					<Skeleton className='h-8 w-8 rounded-md bg-zinc-100' />
				</span>

				<Separator className='text-muted' />

				<div className='grid grid-cols-1 xl:grid-cols-2 mb-3 gap-4 w-full'>
					{/* Gerando 5 campos de informação simulados */}
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className='flex flex-col gap-1'>
							<Skeleton className='h-4 w-full bg-zinc-100' />
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

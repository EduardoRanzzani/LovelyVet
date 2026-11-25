'use client';

import { ChevronFirstIcon, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	totalElements: number;
	pageSize: number;
	onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, totalElements, pageSize, onPageChange }: PaginationProps) => {
	const start = (currentPage - 1) * pageSize + 1;
	const end = Math.min(currentPage * pageSize, totalElements);

	const generatePages = () => {
		const pages: (number | string)[] = [];

		// Ajustado de 5 para 3 para melhor adequação mobile
		const visibleRange = 3;

		let startPage = Math.max(1, currentPage - Math.floor(visibleRange / 2));
		let endPage = startPage + visibleRange - 1;

		if (endPage > totalPages) {
			endPage = totalPages;
			startPage = Math.max(1, endPage - visibleRange + 1);
		}

		// Sempre mostrar a página 1
		if (startPage > 1) {
			pages.push(1);
			if (startPage > 2) {
				pages.push('...');
			}
		}

		// Range principal (agora limitado a 3 itens)
		for (let i = startPage; i <= endPage; i++) {
			pages.push(i);
		}

		// Sempre mostrar a última página
		if (endPage < totalPages) {
			if (endPage < totalPages - 1) {
				pages.push('...');
			}
			pages.push(totalPages);
		}

		return pages;
	};

	return (
		<div className='flex flex-col items-center justify-between gap-4 text-zinc-700 mt-5 w-full overflow-hidden'>
			{/* Texto informativo - Quebra em duas linhas se necessário no mobile */}
			<span className='text-xs sm:text-sm text-muted-foreground text-center px-2'>
				Exibindo <span className='font-medium text-foreground'>{totalElements > 0 ? start : 0}</span> a{' '}
				<span className='font-medium text-foreground'>{end}</span> de{' '}
				<span className='font-medium text-foreground'>{totalElements}</span>
				<span className='hidden xs:inline'>
					{' '}
					— Página {currentPage} de {totalPages}
				</span>
			</span>

			{/* Container de Botões - Gap menor no mobile */}
			<div className='flex items-center gap-0.5 sm:gap-1'>
				{/* Primeira Página - Escondida em telas muito pequenas (xs) */}
				<Button
					size='icon'
					variant='outline'
					disabled={currentPage === 1}
					onClick={() => onPageChange(1)}
					className='h-8 w-8 sm:h-9 sm:w-9 bg-zinc-100/50 border-zinc-200'
				>
					<ChevronFirstIcon className='w-4 h-4' />
				</Button>

				{/* Anterior */}
				<Button
					size='icon'
					variant='outline'
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage === 1}
					className='h-8 w-8 sm:h-9 sm:w-9 bg-zinc-100/50 border-zinc-200'
				>
					<ChevronLeft className='w-4 h-4' />
				</Button>

				{/* Renderização das Páginas */}
				<div className='flex items-center gap-0.5 sm:gap-1'>
					{generatePages().map((page, idx) =>
						page === '...' ? (
							<span key={`ellipsis-${idx}`} className='w-6 text-center text-zinc-400 text-xs select-none'>
								...
							</span>
						) : (
							<Button
								key={`page-${page}`}
								size='icon'
								variant={page === currentPage ? 'default' : 'outline'}
								onClick={() => onPageChange(Number(page))}
								className={`h-8 w-8 sm:h-9 sm:w-9 border-zinc-200 text-xs sm:text-sm ${
									page === currentPage ? 'bg-primary pointer-events-none' : 'bg-zinc-100/50'
								}`}
							>
								{page}
							</Button>
						),
					)}
				</div>

				{/* Próxima */}
				<Button
					size='icon'
					variant='outline'
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage === totalPages || totalPages === 0}
					className='h-8 w-8 sm:h-9 sm:w-9 bg-zinc-100/50 border-zinc-200'
				>
					<ChevronRight className='w-4 h-4' />
				</Button>

				{/* Última - Escondida em telas muito pequenas (xs) */}
				<Button
					size='icon'
					variant='outline'
					onClick={() => onPageChange(totalPages)}
					disabled={currentPage === totalPages || totalPages === 0}
					className='flex h-8 w-8 sm:h-9 sm:w-9 bg-zinc-100/50 border-zinc-200'
				>
					<ChevronLast className='w-4 h-4' />
				</Button>
			</div>
		</div>
	);
};

export default Pagination;

'use client';

import { deleteBreed } from '@/api/actions/breeds.actions';
import { MAX_PAGE_SIZE, PaginatedData } from '@/api/config/consts';
import { BreedsWithRelations } from '@/api/schema/breeds.schema';
import { Species } from '@/api/schema/species.schema';
import AddButton from '@/components/list/add-button';
import DeleteAlertButton from '@/components/list/delete-alert-dialog';
import EditButton from '@/components/list/edit-button';
import SearchInput from '@/components/list/search-input';
import TableComponent from '@/components/list/table-component';
import LoadingDialog from '@/components/ui/loading';
import { TableCell, TableRow } from '@/components/ui/table';
import { handleNavigation } from '@/lib/utils';
import { CatIcon, DogIcon, PawPrintIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useSearchParams } from 'next/navigation';
import { use } from 'react';
import { toast } from 'sonner';
import BreedFormClient from './breed-form';

interface BreedsListClientProps {
	breeds: Promise<PaginatedData<BreedsWithRelations>>;
	species: Species[];
}

const BreedsListClient = ({ breeds, species }: BreedsListClientProps) => {
	const breedsResolved = use(breeds);
	const searchParams = useSearchParams();

	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('page', page.toString());
		handleNavigation(params);
	};

	const handleDelete = (breedId: string) => {
		deleteBreedAction.execute({
			id: breedId,
		});
	};

	const deleteBreedAction = useAction(deleteBreed, {
		onSuccess: () => {
			toast.success('Raça deletada com sucesso!');
		},
		onError: (err) => {
			console.error('Erro ao deletar raça:', err);
			toast.error('Ocorreu um erro ao tentar deletar a raça. Tente novamente mais tarde.');
		},
	});

	const columns = [
		{ header: 'Descrição', accessorKey: 'name' },
		{ header: 'Espécie', accessorKey: 'specie' },
		{ header: 'Ações', accessorKey: 'actions' },
	];

	const renderRow = (breed: BreedsWithRelations) => {
		return (
			<TableRow key={breed.id}>
				<TableCell>
					<div className='flex items-center gap-4'>
						<span className='rounded-full border p-2 w-10 h-10'>
							{breed.specie.name === 'Canino' ? (
								<DogIcon />
							) : breed.specie.name === 'Felino' ? (
								<CatIcon />
							) : (
								<PawPrintIcon />
							)}
						</span>
						{breed.name}
					</div>
				</TableCell>
				<TableCell>{breed.specie.name}</TableCell>
				<TableCell className='w-20 space-x-2'>
					<EditButton
						tooltip={`Editar ${breed.name}`}
						renderForm={(close) => <BreedFormClient breed={breed} species={species} onSuccess={close} />}
					/>

					<DeleteAlertButton action={() => handleDelete(breed.id)} />
				</TableCell>
			</TableRow>
		);
	};

	const renderMobile = (breed: BreedsWithRelations) => {
		return (
			<div key={breed.id} className='flex flex-col gap-4'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-4'>
						<div className='flex items-center gap-4'>
							<span className='rounded-full border p-2 w-12 h-12 flex items-center justify-center'>
								{breed.specie.name === 'Canino' ? (
									<DogIcon className='h-12 w-12' />
								) : breed.specie.name === 'Felino' ? (
									<CatIcon className='h-12 w-12' />
								) : (
									<PawPrintIcon className='h-12 w-12' />
								)}
							</span>
						</div>

						<div className='flex flex-col justify-center'>
							{breed.name}
							<p className='text-xs text-muted-foreground'>{breed.specie.name}</p>
						</div>
					</div>

					<div className='flex flex-col gap-2'>
						<EditButton
							tooltip={`Editar ${breed.name}`}
							renderForm={(close) => (
								<BreedFormClient breed={breed} species={species} onSuccess={close} />
							)}
						/>

						<DeleteAlertButton action={() => handleDelete(breed.id)} />
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className='flex flex-col w-full gap-4'>
			<div className='flex flex-col lg:flex-row items-center justify-between gap-4'>
				<SearchInput />

				<AddButton
					text='Adicionar Raça'
					renderForm={(close) => <BreedFormClient species={species} onSuccess={close} />}
				/>
			</div>

			{deleteBreedAction.isPending && <LoadingDialog />}

			<TableComponent
				emptyMessage='Nenhuma espécie encontrada...'
				columns={columns}
				renderRow={renderRow}
				renderMobile={renderMobile}
				data={breedsResolved?.data}
				currentPage={breedsResolved?.metadata.currentPage}
				totalPages={breedsResolved?.metadata.pageCount}
				totalElements={breedsResolved?.metadata.totalCount}
				pageSize={MAX_PAGE_SIZE}
				onPageChange={handlePageChange}
			/>
		</div>
	);
};

export default BreedsListClient;

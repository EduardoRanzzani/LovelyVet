'use client';

import { deleteService } from '@/api/actions/services.actions';
import { MAX_PAGE_SIZE, PaginatedData } from '@/api/config/consts';
import { ServicesWithRelations } from '@/api/schema/services.schema';
import { Species } from '@/api/schema/species.schema';
import AddButton from '@/components/list/add-button';
import DeleteAlertButton from '@/components/list/delete-alert-dialog';
import EditButton from '@/components/list/edit-button';
import SearchInput from '@/components/list/search-input';
import TableComponent from '@/components/list/table-component';
import LoadingDialog from '@/components/ui/loading';
import { Separator } from '@/components/ui/separator';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatCurrencyFromCents } from '@/helpers/currency';
import { handleNavigation } from '@/lib/utils';
import { CatIcon, DogIcon, DollarSignIcon, NotepadTextIcon, PawPrintIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useSearchParams } from 'next/navigation';
import { use } from 'react';
import { toast } from 'sonner';
import ServiceFormClient from './service-form';

interface ServicesListClientProps {
	services: Promise<PaginatedData<ServicesWithRelations>>;
	species: Species[];
}

const ServicesListClient = ({ services, species }: ServicesListClientProps) => {
	const servicesResolved = use(services);
	const searchParams = useSearchParams();

	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('page', page.toString());
		handleNavigation(params);
	};

	const columns = [
		{ header: 'Nome', accessorKey: 'name' },
		{ header: 'Preço', accessorKey: 'priceInCents' },
		{ header: 'Espécie', accessorKey: 'specie' },
		{ header: 'Descrição', accessorKey: 'description' },
		{ header: 'Ações', accessorKey: 'actions' },
	];

	const handleDelete = (serviceId: string) => {
		deleteServiceAction.execute({
			id: serviceId,
		});
	};

	const deleteServiceAction = useAction(deleteService, {
		onSuccess: () => {
			toast.success('Serviço deletado com sucesso!');
		},
		onError: (err) => {
			console.error('Erro ao deletar serviço:', err);
			toast.error('Ocorreu um erro ao tentar deletar o serviço. Tente novamente mais tarde.');
		},
	});

	const renderRow = (service: ServicesWithRelations) => {
		return (
			<TableRow key={service.id}>
				<TableCell>{service.name}</TableCell>
				<TableCell>{formatCurrencyFromCents(service.priceInCents)}</TableCell>
				<TableCell>{service.specie?.name ?? 'Geral'}</TableCell>
				<TableCell>{service.description ? service.description : <span className='italic'>---</span>}</TableCell>
				<TableCell className='w-20 space-x-2'>
					<EditButton
						tooltip={`Editar '${service.name}'`}
						renderForm={(close) => (
							<ServiceFormClient species={species} service={service} onSuccess={close} />
						)}
					/>

					<DeleteAlertButton tooltip={`Deletar '${service.name}'`} action={() => handleDelete(service.id)} />
				</TableCell>
			</TableRow>
		);
	};

	const renderMobile = (service: ServicesWithRelations) => {
		return (
			<div key={service.id} className='flex flex-col gap-4'>
				<div className='flex items-center justify-between'>
					<h3 className='font-bold'>{service.name}</h3>

					<div className='flex flex-col gap-2'>
						<EditButton
							tooltip={`Editar '${service.name}'`}
							renderForm={(close) => (
								<ServiceFormClient species={species} service={service} onSuccess={close} />
							)}
						/>

						<DeleteAlertButton
							tooltip={`Deletar '${service.name}'`}
							action={() => handleDelete(service.id)}
						/>
					</div>
				</div>

				<Separator />

				<div className='flex flex-col gap-2'>
					<p className='flex items-center gap-4'>
						<span className='text-sm font-semibold'>
							<NotepadTextIcon className='h-4 w-4' />
						</span>
						<span className='text-sm'>
							{service.description ? (
								service.description
							) : (
								<span className='italic text-muted-foreground'>Descrição não fornecida</span>
							)}
						</span>
					</p>

					<p className='flex items-center gap-4'>
						{service.specie && service.specie?.name === 'Canino' ? (
							<>
								<span className='text-sm font-semibold'>
									<DogIcon className='h-4 w-4' />
								</span>
								<span className='text-sm'>{service.specie.name}</span>
							</>
						) : service.specie?.name === 'Felino' ? (
							<>
								<span className='text-sm font-semibold'>
									<CatIcon className='h-4 w-4' />
								</span>
								<span className='text-sm'>{service.specie.name}</span>
							</>
						) : (
							<>
								<span className='text-sm font-semibold'>
									<PawPrintIcon className='h-4 w-4' />
								</span>
								<span className='text-sm'>Geral</span>
							</>
						)}
					</p>

					<p className='flex items-center gap-4'>
						<span className='text-sm font-semibold'>
							<DollarSignIcon className='h-4 w-4' />
						</span>
						<span className='text-sm'>{formatCurrencyFromCents(service.priceInCents)}</span>
					</p>
				</div>
			</div>
		);
	};

	return (
		<div className='flex flex-col w-full gap-4'>
			<div className='flex flex-col lg:flex-row items-center justify-between gap-4'>
				<SearchInput />

				<AddButton
					text={'Adicionar Serviço'}
					renderForm={(close) => <ServiceFormClient species={species} onSuccess={close} />}
				/>
			</div>

			{deleteServiceAction.isPending && <LoadingDialog />}

			<TableComponent
				emptyMessage='Nenhum serviço encontrado...'
				columns={columns}
				renderRow={renderRow}
				renderMobile={renderMobile}
				data={servicesResolved?.data}
				currentPage={servicesResolved?.metadata.currentPage}
				totalPages={servicesResolved?.metadata.pageCount}
				totalElements={servicesResolved?.metadata.totalCount}
				pageSize={MAX_PAGE_SIZE}
				onPageChange={handlePageChange}
			/>
		</div>
	);
};

export default ServicesListClient;

'use client';
import { deletePrescriptionItem } from '@/api/actions/prescriptions-items.actions';
import { MAX_PAGE_SIZE, PaginatedData } from '@/api/config/consts';
import { PrescriptionItemsWithRelations } from '@/api/schema/prescriptions-items.schema';
import AddButton from '@/components/list/add-button';
import DeleteAlertButton from '@/components/list/delete-alert-dialog';
import EditButton from '@/components/list/edit-button';
import SearchInput from '@/components/list/search-input';
import TableComponent from '@/components/list/table-component';
import { Separator } from '@/components/ui/separator';
import { TableCell, TableRow } from '@/components/ui/table';
import { handleNavigation } from '@/lib/utils';
import { NotebookIcon, PillBottleIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useSearchParams } from 'next/navigation';
import { use } from 'react';
import { toast } from 'sonner';
import PrescriptionItemFormClient from './prescription-item-form';

interface PrescriptionsItemsListClientProps {
	prescriptionsItems: Promise<PaginatedData<PrescriptionItemsWithRelations>>;
}

export const PrescriptionsItemsListClient = ({
	prescriptionsItems,
}: PrescriptionsItemsListClientProps) => {
	const prescriptionsItemsResolved = use(prescriptionsItems);
	const searchParams = useSearchParams();

	const stripHtml = (html: string) => {
		const doc = new DOMParser().parseFromString(html, 'text/html');
		return doc.body.textContent || '';
	};

	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('page', page.toString());
		handleNavigation(params);
	};

	const handleDelete = (prescriptionItemId: string) => {
		deletePrescriptionItemAction.execute({
			id: prescriptionItemId,
		});
	};

	const deletePrescriptionItemAction = useAction(deletePrescriptionItem, {
		onSuccess: () => {
			toast.success('Item removido com sucesso!');
		},
		onError: (err) => {
			console.error('Erro ao deletar item:', err);
			toast.error(
				'Ocorreu um erro ao tentar deletar o item. Tente novamente mais tarde.',
			);
		},
	});

	const columns = [
		{ header: 'Nome', accessorKey: 'name' },
		{ header: 'Farmácia', accessorKey: 'pharmacy' },
		{ header: 'Quantidade', accessorKey: 'quantity' },
		{ header: 'Orientações', accessorKey: 'orientations' },
	];

	const renderRow = (item: PrescriptionItemsWithRelations) => {
		return (
			<TableRow key={item.id}>
				<TableCell>{item.name}</TableCell>
				<TableCell>{item.pharmacy}</TableCell>
				<TableCell>{item.quantity}</TableCell>
				<TableCell>{stripHtml(item.orientations)}</TableCell>
				<TableCell className='w-20 space-x-2'>
					<EditButton
						tooltip={`Editar ${item.name}`}
						renderForm={(close) => (
							<PrescriptionItemFormClient
								prescriptionItem={item}
								onSuccess={close}
							/>
						)}
					/>

					<DeleteAlertButton
						tooltip={`Deletar ${item.name}`}
						action={() => handleDelete(item.id)}
					/>
				</TableCell>
			</TableRow>
		);
	};

	const renderMobile = (item: PrescriptionItemsWithRelations) => {
		return (
			<div key={item.id} className='flex flex-col gap-4'>
				<div className='flex items-center justify-between'>
					<h3 className='font-bold'>{item.name}</h3>
					<div className=''></div>
				</div>

				<Separator />

				<div className='flex flex-col gap-2'>
					<p className='flex gap-2 items-center'>
						<span className='text-sm font-semibold'>
							<NotebookIcon className='h-4 w-4' />
						</span>
						<span className='text-sm'>{item.quantity}</span>
					</p>

					<p className='flex gap-2 items-center'>
						<span className='text-sm font-semibold'>
							<PillBottleIcon className='h-4 w-4' />
						</span>
						<span className='text-sm'>{item.pharmacy}</span>
					</p>

					<p className='flex gap-2 items-center'>
						<span className='text-sm font-semibold'>
							<NotebookIcon className='h-4 w-4' />
						</span>
						<span
							className='text-sm'
							dangerouslySetInnerHTML={{ __html: item.orientations }}
						/>
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
					text={'Adicionar Item '}
					renderForm={(close) => (
						<PrescriptionItemFormClient onSuccess={close} />
					)}
				/>
			</div>

			{/* {deleteServiceAction.isPending && <LoadingDialog />} */}

			<TableComponent
				emptyMessage='Nenhum item de receita encontrado...'
				columns={columns}
				renderRow={renderRow}
				renderMobile={renderMobile}
				data={prescriptionsItemsResolved?.data}
				currentPage={prescriptionsItemsResolved?.metadata.currentPage}
				totalPages={prescriptionsItemsResolved?.metadata.pageCount}
				totalElements={prescriptionsItemsResolved?.metadata.totalCount}
				pageSize={MAX_PAGE_SIZE}
				onPageChange={handlePageChange}
			/>
		</div>
	);
};

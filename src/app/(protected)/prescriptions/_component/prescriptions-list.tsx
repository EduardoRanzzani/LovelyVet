'use client';
import { MAX_PAGE_SIZE, PaginatedData } from '@/api/config/consts';
import { DoctorsWithRelations } from '@/api/schema/doctors.schema';
import { PrescriptionsWithRelations } from '@/api/schema/prescriptions.schema';
import AddButton from '@/components/list/add-button';
import DeleteAlertButton from '@/components/list/delete-alert-dialog';
import EditButton from '@/components/list/edit-button';
import SearchInput from '@/components/list/search-input';
import TableComponent from '@/components/list/table-component';
import { Button } from '@/components/ui/button';
import LoadingDialog from '@/components/ui/loading';
import { TableCell, TableRow } from '@/components/ui/table';
import { handleNavigation } from '@/lib/utils';
import { DownloadIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { use } from 'react';
import { toast } from 'sonner';
import PrescriptionFormClient from './prescription-form';
import { PrescriptionItemsWithRelations } from '@/api/schema/prescriptions-items.schema';
import { PetsWithRelations } from '@/api/schema/pets.schema';

interface PrescriptionsListClientProps {
	prescriptionItems: PrescriptionItemsWithRelations[];
	prescriptions: Promise<PaginatedData<PrescriptionsWithRelations>>;
	doctors: DoctorsWithRelations[];
	pets: PetsWithRelations[];
}

const PrescriptionsListClient = ({
	prescriptionItems,
	prescriptions,
	doctors,
	pets,
}: PrescriptionsListClientProps) => {
	const prescriptionsResolved = use(prescriptions);
	const searchParams = useSearchParams();

	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('page', page.toString());
		handleNavigation(params);
	};

	// const handleDelete = (id: string) => {
	// 	deletePrescriptionAction.execute({
	// 		id: id,
	// 	});
	// };

	// const deletePrescriptionAction = useAction(deletePrescription, {
	// 	onSuccess: () => {
	// 		toast.success('Modelo de receita deletado com sucesso!');
	// 	},
	// 	onError: (err) => {
	// 		console.error('Erro ao deletar modelo de receita:', { err });
	// 		toast.error(
	// 			'Ocorreu um erro ao tentar deletar o modelo de receita. Tente novamente mais tarde.',
	// 		);
	// 	},
	// });

	const columns = [
		{ header: 'Pet', accessorKey: 'pet' },
		{ header: 'Data', accessorKey: 'createdAt' },
		{ header: 'Ações', accessorKey: 'actions' },
	];

	const renderRow = (prescription: PrescriptionsWithRelations) => {
		return (
			<TableRow key={prescription.id}>
				<TableCell>{prescription.pet.name}</TableCell>
				<TableCell>
					{prescription.createdAt.toLocaleDateString('pt-BR')}
				</TableCell>
				<TableCell className='w-20 space-x-2'>
					<Button asChild>
						<Link href={`/prescriptions/print/${prescription.id}`}>
							<DownloadIcon className='w-4 h-4 mr-2' />
							Baixar PDF
						</Link>
					</Button>

					<EditButton tooltip={`Editar`} renderForm={(close) => <></>} />

					{/* <DeleteAlertButton action={() => handleDelete(prescription.id)} /> */}
				</TableCell>
			</TableRow>
		);
	};

	const renderMobile = (prescription: PrescriptionsWithRelations) => {
		return (
			<div key={prescription.id} className='flex flex-col gap-4'>
				<div className='flex flex-row items-center justify-between'>
					<h3>{prescription.pet.name}</h3>

					<span className='text-sm text-muted-foreground'>
						{prescription.createdAt.toLocaleDateString('pt-BR')}
					</span>

					<span className='flex flex-col gap-2'>
						<EditButton
							renderForm={(close) => (
								<PrescriptionFormClient
									prescription={prescription}
									prescriptionItems={prescriptionItems}
									doctors={doctors}
									pets={pets}
									onSuccess={close}
								/>
							)}
						/>

						<Button asChild size={'icon'} variant={'secondary'}>
							<Link href={`/prescriptions/print/${prescription.id}`}>
								<DownloadIcon />
							</Link>
						</Button>

						{/* <DeleteAlertButton action={() => handleDelete(prescription.id)} /> */}
					</span>
				</div>
				<div className='flex items-center justify-between w-full'>
					<div
						className='prose prose-sm dark:prose-invert max-w-none'
						dangerouslySetInnerHTML={{
							__html: prescription.content as string,
						}}
					/>
				</div>
			</div>
		);
	};

	return (
		<div className='flex flex-col w-full gap-4'>
			<div className='flex flex-col lg:flex-row items-center justify-between gap-4'>
				<SearchInput />

				<AddButton
					text='Adicionar Modelo'
					renderForm={(close) => (
						<PrescriptionFormClient
							prescriptionItems={prescriptionItems}
							doctors={doctors}
							pets={pets}
							onSuccess={close}
						/>
					)}
				/>
			</div>

			{/* {deletePrescriptionAction.isPending && <LoadingDialog />} */}

			<TableComponent
				emptyMessage='Nenhum modelo de receita cadastrado...'
				columns={columns}
				renderRow={renderRow}
				renderMobile={renderMobile}
				data={prescriptionsResolved?.data}
				currentPage={prescriptionsResolved?.metadata.currentPage}
				totalPages={prescriptionsResolved?.metadata.pageCount}
				totalElements={prescriptionsResolved?.metadata.totalCount}
				pageSize={MAX_PAGE_SIZE}
				onPageChange={handlePageChange}
			/>
		</div>
	);
};

export default PrescriptionsListClient;

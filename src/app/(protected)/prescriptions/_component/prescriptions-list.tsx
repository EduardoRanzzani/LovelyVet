'use client';
import { deletePrescriptionTemplate } from '@/api/actions/prescriptions-template.actions';
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
import PrescriptionTemplateFormClient from './prescription-form';

interface PrescriptionsTemplateListClientProps {
	prescriptions: Promise<PaginatedData<PrescriptionsWithRelations>>;
	doctors: DoctorsWithRelations[];
}

const PrescriptionsTemplateListClient = ({
	prescriptions,
	doctors,
}: PrescriptionsTemplateListClientProps) => {
	const prescriptionsResolved = use(prescriptions);
	const searchParams = useSearchParams();

	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('page', page.toString());
		handleNavigation(params);
	};

	const handleDelete = (id: string) => {
		deletePrescriptionTemplateAction.execute({
			id: id,
		});
	};

	const deletePrescriptionTemplateAction = useAction(
		deletePrescriptionTemplate,
		{
			onSuccess: () => {
				toast.success('Modelo de receita deletado com sucesso!');
			},
			onError: (err) => {
				console.error('Erro ao deletar modelo de receita:', { err });
				toast.error(
					'Ocorreu um erro ao tentar deletar o modelo de receita. Tente novamente mais tarde.',
				);
			},
		},
	);

	const columns = [
		{ header: 'Pet', accessorKey: 'pet' },
		{ header: 'Ações', accessorKey: 'actions' },
	];

	const renderRow = (prescription: PrescriptionsWithRelations) => {
		return (
			<TableRow key={prescription.id}>
				<TableCell>{prescription.pet.name}</TableCell>
				<TableCell className='w-20 space-x-2'>
					<Button asChild>
						<Link href={`/prescriptions/print/${prescription.id}`}>
							<DownloadIcon className='w-4 h-4 mr-2' />
							Baixar PDF
						</Link>
					</Button>

					<EditButton tooltip={`Editar`} renderForm={(close) => <></>} />

					<DeleteAlertButton action={() => handleDelete(prescription.id)} />
				</TableCell>
			</TableRow>
		);
	};

	const renderMobile = (prescription: PrescriptionsWithRelations) => {
		return (
			<div key={prescription.id} className='flex flex-col gap-4'>
				<div className='flex items-center justify-between'>
					<h3 className='font-bold'>{prescription.content}</h3>

					<span className='flex flex-col gap-2'>
						<EditButton renderForm={(close) => <></>} />

						<DeleteAlertButton action={() => handleDelete(prescription.id)} />
					</span>
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
						<PrescriptionTemplateFormClient
							doctors={doctors}
							onSuccess={close}
						/>
					)}
				/>
			</div>

			{deletePrescriptionTemplateAction.isPending && <LoadingDialog />}

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

export default PrescriptionsTemplateListClient;

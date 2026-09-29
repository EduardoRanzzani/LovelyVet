'use client';

import { MAX_PAGE_SIZE, PaginatedData } from '@/api/config/consts';
import { PrescriptionsWithRelations } from '@/api/schema/prescriptions.schema';
import SearchInput from '@/components/list/search-input';
import TableComponent from '@/components/list/table-component';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { handleNavigation } from '@/lib/utils';
import {
	DownloadIcon,
	FilePenLineIcon,
	HistoryIcon,
	PlusIcon,
	ShieldCheckIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { use } from 'react';

interface PrescriptionsListClientProps {
	prescriptions: Promise<PaginatedData<PrescriptionsWithRelations>>;
}

interface PrescriptionActionsProps {
	prescription: PrescriptionsWithRelations;
}

const PrescriptionActions = ({ prescription }: PrescriptionActionsProps) => {
	if (prescription.signature) {
		return (
			<Button asChild size='sm' variant='outline'>
				<a href={`/api/prescriptions/${prescription.id}/signed-pdf`}>
					<ShieldCheckIcon className='size-4' />
					PDF assinado
				</a>
			</Button>
		);
	}

	if (prescription.documentData) {
		return (
			<div className='flex flex-wrap gap-2'>
				<Button asChild size='sm' variant='outline'>
					<Link
						href={`/pets/${prescription.petId}/documents/new?prescriptionId=${prescription.id}`}
					>
						<FilePenLineIcon className='size-4' />
						Editar
					</Link>
				</Button>

				<Button asChild size='sm'>
					<Link href={`/prescriptions/print/${prescription.id}`}>
						<DownloadIcon className='size-4' />
						PDF
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<Button asChild size='sm' variant='outline'>
			<Link href={`/pets/${prescription.petId}`}>
				<HistoryIcon className='size-4' />
				Ver no histórico
			</Link>
		</Button>
	);
};

const PrescriptionStatus = ({ prescription }: PrescriptionActionsProps) => {
	if (prescription.signature) {
		return (
			<Badge variant='outline'>
				<ShieldCheckIcon className='size-3' />
				Assinada
			</Badge>
		);
	}

	if (prescription.documentData) {
		return <Badge variant='secondary'>Editável</Badge>;
	}

	return <Badge variant='outline'>Legada</Badge>;
};

const PrescriptionsListClient = ({
	prescriptions,
}: PrescriptionsListClientProps) => {
	const prescriptionsResolved = use(prescriptions);
	const searchParams = useSearchParams();

	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());

		params.set('page', page.toString());

		handleNavigation(params);
	};

	const columns = [
		{ header: 'Pet', accessorKey: 'pet' },
		{ header: 'Data', accessorKey: 'createdAt' },
		{ header: 'Status', accessorKey: 'status' },
		{ header: 'Ações', accessorKey: 'actions' },
	];

	const renderRow = (prescription: PrescriptionsWithRelations) => (
		<TableRow key={prescription.id}>
			<TableCell>{prescription.pet.name}</TableCell>

			<TableCell>{prescription.issuedAt.toLocaleDateString('pt-BR')}</TableCell>

			<TableCell>
				<PrescriptionStatus prescription={prescription} />
			</TableCell>

			<TableCell>
				<PrescriptionActions prescription={prescription} />
			</TableCell>
		</TableRow>
	);

	const renderMobile = (prescription: PrescriptionsWithRelations) => (
		<div key={prescription.id} className='flex flex-col gap-4'>
			<div className='flex items-start justify-between gap-4'>
				<div className='min-w-0'>
					<h3 className='font-medium'>{prescription.pet.name}</h3>

					<p className='text-sm text-muted-foreground'>
						{prescription.issuedAt.toLocaleDateString('pt-BR')}
					</p>
				</div>

				<PrescriptionStatus prescription={prescription} />
			</div>

			<div
				className='prose prose-sm dark:prose-invert max-w-none line-clamp-4'
				dangerouslySetInnerHTML={{
					__html: prescription.content,
				}}
			/>

			<PrescriptionActions prescription={prescription} />
		</div>
	);

	return (
		<div className='flex flex-col w-full gap-4'>
			<div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
				<SearchInput />

				<Button asChild>
					<Link href='/pets'>
						<PlusIcon className='size-4' />
						Nova receita
					</Link>
				</Button>
			</div>

			<TableComponent
				emptyMessage='Nenhuma receita encontrada.'
				columns={columns}
				renderRow={renderRow}
				renderMobile={renderMobile}
				data={prescriptionsResolved.data}
				currentPage={prescriptionsResolved.metadata.currentPage}
				totalPages={prescriptionsResolved.metadata.pageCount}
				totalElements={prescriptionsResolved.metadata.totalCount}
				pageSize={MAX_PAGE_SIZE}
				onPageChange={handlePageChange}
			/>
		</div>
	);
};

export default PrescriptionsListClient;

'use client';

import { MAX_PAGE_SIZE, PaginatedData } from '@/api/config/consts';
import { Clinics } from '@/api/schema/clinics.schema';
import { GoogleMapsIcon } from '@/components/icons/icon-googlemaps';
import AddButton from '@/components/list/add-button';
import SearchInput from '@/components/list/search-input';
import TableComponent from '@/components/list/table-component';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { handleNavigation } from '@/lib/utils';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { use } from 'react';
import ClinicFormClient from './clinic-form';
import { formatCurrencyFromCents } from '@/helpers/currency';
import EditButton from '@/components/list/edit-button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BanknoteIcon, MapPinIcon, PhoneIcon } from 'lucide-react';

interface ClinicsListClientProps {
	clinics: Promise<PaginatedData<Clinics>>;
}

const ClinicsListClient = ({ clinics }: ClinicsListClientProps) => {
	const clinicsResolved = use(clinics);
	const searchParams = useSearchParams();

	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('page', page.toString());
		handleNavigation(params);
	};

	const columns = [
		{ header: 'Nome', accessorKey: 'name' },
		{ header: 'Endereço', accessorKey: 'address' },
		{ header: 'Valor do Plantão', accessorKey: 'defaultShiftPriceInCents' },
		{ header: 'Ativa', accessorKey: 'isActive' },
		{ header: 'Ações', accessorKey: 'actions' },
	];

	const renderRow = (clinic: Clinics) => {
		const fullAddress = `${clinic.address}, ${clinic.addressNumber} - ${clinic.neighborhood}, ${clinic.city}/${clinic.state}`;
		const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
			fullAddress,
		)}`;

		return (
			<TableRow key={clinic.id}>
				<TableCell>
					<span className='flex flex-col gap-1'>
						<h3 className='font-bold'>{clinic.name}</h3>
						<p className='text-xs text-muted-foreground'>{clinic.phone}</p>
					</span>
				</TableCell>

				<TableCell>
					<div className='flex items-center gap-4'>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button asChild variant={'outline'} className='2xl:size-9'>
									<Link
										href={googleMapsUrl}
										target='_blank'
										rel='noopener noreferrer'
									>
										<GoogleMapsIcon />
										<span className='flex 2xl:hidden'>
											Abrir no Google Maps
										</span>
									</Link>
								</Button>
							</TooltipTrigger>
							<TooltipContent>Abrir no Google Maps</TooltipContent>
						</Tooltip>
						<span className='hidden 2xl:flex'>{fullAddress}</span>
					</div>
				</TableCell>

				<TableCell className='w-20 space-x-2'>
					<span className='text-sm font-semibold'>
						<span className='text-sm'>
							{formatCurrencyFromCents(clinic.defaultShiftPriceInCents)}
						</span>
					</span>
				</TableCell>

				<TableCell className='w-20 space-x-2'>
					<span className='text-sm font-semibold'>
						<span className='text-sm'>{clinic.isActive ? 'Sim' : 'Não'}</span>
					</span>
				</TableCell>

				<TableCell className='w-20 space-x-2'>
					<EditButton
						tooltip={`Editar '${clinic.name}'`}
						renderForm={(close) => (
							<ClinicFormClient clinic={clinic} onSuccess={close} />
						)}
					/>
				</TableCell>
			</TableRow>
		);
	};

	const renderMobile = (clinic: Clinics) => {
		const fullAddress = `${clinic.address}, ${clinic.addressNumber} - ${clinic.neighborhood}, ${clinic.city}/${clinic.state}`;

		const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
			fullAddress,
		)}`;

		return (
			<div key={clinic.id} className='flex flex-col gap-4'>
				<div className='flex items-start justify-between gap-4'>
					<div className='flex min-w-0 flex-col gap-1'>
						<div className='flex flex-wrap items-center gap-2'>
							<h3 className='font-bold'>{clinic.name}</h3>

							<Badge variant={clinic.isActive ? 'default' : 'secondary'}>
								{clinic.isActive ? 'Ativa' : 'Inativa'}
							</Badge>
						</div>

						<p className='text-xs text-muted-foreground'>
							{clinic.city}/{clinic.state}
						</p>
					</div>

					<EditButton
						tooltip={`Editar '${clinic.name}'`}
						renderForm={(close) => (
							<ClinicFormClient clinic={clinic} onSuccess={close} />
						)}
					/>
				</div>

				<Separator />

				<div className='flex flex-col gap-3'>
					<div className='flex items-center gap-3'>
						<PhoneIcon className='h-4 w-4 shrink-0 text-muted-foreground' />

						<span className='text-sm'>{clinic.phone}</span>
					</div>

					<div className='flex items-start gap-3'>
						<MapPinIcon className='mt-0.5 h-4 w-4 shrink-0 text-muted-foreground' />

						<span className='text-sm'>{fullAddress}</span>
					</div>

					<div className='flex items-center gap-3'>
						<BanknoteIcon className='h-4 w-4 shrink-0 text-muted-foreground' />

						<span className='text-sm font-semibold'>
							{formatCurrencyFromCents(clinic.defaultShiftPriceInCents)}
						</span>
					</div>
				</div>

				<Button asChild variant='outline' className='w-full'>
					<Link href={googleMapsUrl} target='_blank' rel='noopener noreferrer'>
						<GoogleMapsIcon />
						Abrir no Google Maps
					</Link>
				</Button>
			</div>
		);
	};

	return (
		<div className='flex flex-col w-full gap-4'>
			<div className='flex flex-col lg:flex-row items-center justify-between gap-4'>
				<SearchInput />

				<AddButton
					text='Adicionar Clínica'
					renderForm={(close) => <ClinicFormClient onSuccess={close} />}
				/>
			</div>

			<TableComponent
				emptyMessage='Nenhuma clínica encontrada...'
				columns={columns}
				renderRow={renderRow}
				renderMobile={renderMobile}
				data={clinicsResolved?.data}
				currentPage={clinicsResolved?.metadata.currentPage}
				totalPages={clinicsResolved?.metadata.pageCount}
				totalElements={clinicsResolved?.metadata.totalCount}
				pageSize={MAX_PAGE_SIZE}
				onPageChange={handlePageChange}
			/>
		</div>
	);
};

export default ClinicsListClient;

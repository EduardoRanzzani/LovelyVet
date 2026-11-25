'use client';

import { MAX_PAGE_SIZE, PaginatedData } from '@/api/config/consts';
import { DoctorsWithRelations } from '@/api/schema/doctors.schema';
import { getInitials } from '@/api/util';
import AddButton from '@/components/list/add-button';
import EditButton from '@/components/list/edit-button';
import SearchInput from '@/components/list/search-input';
import TableComponent from '@/components/list/table-component';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { TableCell, TableRow } from '@/components/ui/table';
import { getWeekDay } from '@/helpers/week';
import { handleNavigation } from '@/lib/utils';
import { CalendarIcon, ClockIcon, IdCardIcon, PhoneIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { use } from 'react';
import DoctorFormClient from './doctor-form';

interface DoctorsListClientProps {
	doctors: Promise<PaginatedData<DoctorsWithRelations>>;
}

const DoctorsListClient = ({ doctors }: DoctorsListClientProps) => {
	const doctorsResolved = use(doctors);
	const searchParams = useSearchParams();

	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('page', page.toString());
		handleNavigation(params);
	};

	const columns = [
		{ header: 'Veterinário', accessorKey: 'name' },
		{ header: 'CPF', accessorKey: 'cpf' },
		{ header: 'Telefone', accessorKey: 'phone' },
		{ header: 'Disponibilidade', accessorKey: 'available' },
		{ header: 'Ações', accessorKey: 'actions' },
	];

	const renderRow = (doctor: DoctorsWithRelations) => {
		return (
			<TableRow key={doctor.id}>
				<TableCell>
					<div className='flex items-center justify-between'>
						<div className='flex gap-4'>
							<Avatar className='h-10 w-10 rounded-full' draggable={false}>
								{doctor.user.image ? (
									<AvatarImage
										src={doctor.user.image}
										alt={doctor.user.name}
										draggable={false}
										className='object-cover'
									/>
								) : (
									<AvatarImage src={'/avatar-placeholder.png'} alt={doctor.user.name} />
								)}
							</Avatar>

							<span className='flex flex-col'>
								<h3>{doctor.user.name}</h3>
								<p className='text-xs text-muted-foreground'>{doctor.user.email}</p>
								<p className='text-xs text-muted-foreground'>
									CRMV/{doctor.licenseState} - {doctor.licenseNumber}
								</p>
							</span>
						</div>
					</div>
				</TableCell>
				<TableCell>{doctor.cpf}</TableCell>
				<TableCell>{doctor.phone}</TableCell>
				<TableCell>
					{getWeekDay(doctor.availableFromWeekDay)} a {getWeekDay(doctor.availableToWeekDay)} das{' '}
					{doctor.availableFromTime} às {doctor.availableToTime}
				</TableCell>
				<TableCell>
					<EditButton
						tooltip={`Editar '${doctor.user.name}'`}
						renderForm={(close) => <DoctorFormClient doctor={doctor} onSuccess={close} />}
					/>
				</TableCell>
			</TableRow>
		);
	};

	const renderMobile = (doctor: DoctorsWithRelations) => {
		return (
			<div key={doctor.id} className='flex flex-col gap-4'>
				<div className='flex items-center justify-between'>
					<div className='flex gap-4'>
						<Avatar className='h-10 w-10 rounded-full' draggable={false}>
							{doctor.user.image ? (
								<AvatarImage src={doctor.user.image} alt={doctor.user.name} />
							) : (
								<AvatarFallback className='rounded-full'>
									{getInitials(doctor.user.name)}
								</AvatarFallback>
							)}
						</Avatar>

						<span className='flex flex-col'>
							<h3 className='font-bold'>{doctor.user.name}</h3>
							<p className='text-xs text-muted-foreground'>
								CRMV/{doctor.licenseState} - {doctor.licenseNumber}
							</p>
						</span>
					</div>

					<EditButton
						tooltip={`Editar '${doctor.user.name}'`}
						renderForm={(close) => <DoctorFormClient doctor={doctor} onSuccess={close} />}
					/>
				</div>

				<Separator />

				<div className='flex flex-col gap-2'>
					<p className='flex gap-2 items-center'>
						<span className='text-sm font-semibold'>
							<IdCardIcon className='w-4 h-4' />
						</span>
						<span className='text-sm'>{doctor.cpf}</span>
					</p>

					<p className='flex gap-2 items-center'>
						<span className='text-sm font-semibold'>
							<PhoneIcon className='w-4 h-4' />
						</span>
						<span className='text-sm'>{doctor.phone}</span>
					</p>

					<p className='flex gap-2 items-center'>
						<span className='text-sm font-semibold'>
							<CalendarIcon className='w-4 h-4' />
						</span>
						<span className='text-sm'>
							De {getWeekDay(doctor.availableFromWeekDay)} a {getWeekDay(doctor.availableToWeekDay)}
						</span>
					</p>

					<p className='flex gap-2 items-center'>
						<span className='text-sm font-semibold'>
							<ClockIcon className='w-4 h-4' />
						</span>
						<span className='text-sm'>
							Das {doctor.availableFromTime} às {doctor.availableToTime}
						</span>
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
					text='Adicionar Veterinário'
					renderForm={(close) => <DoctorFormClient onSuccess={close} />}
				/>
			</div>

			<TableComponent
				emptyMessage='Nenhum veterinário encontrado...'
				columns={columns}
				renderRow={renderRow}
				renderMobile={renderMobile}
				data={doctorsResolved?.data}
				currentPage={doctorsResolved?.metadata.currentPage}
				totalPages={doctorsResolved?.metadata.pageCount}
				totalElements={doctorsResolved?.metadata.totalCount}
				pageSize={MAX_PAGE_SIZE}
				onPageChange={handlePageChange}
			/>
		</div>
	);
};

export default DoctorsListClient;

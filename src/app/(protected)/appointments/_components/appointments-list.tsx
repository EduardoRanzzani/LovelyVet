'use client';

import {
	deleteAppointment,
	markAppointmentAsCancelled,
	markAppointmentAsCompleted,
	markAsConfirmed,
} from '@/api/actions/appointments.actions';
import { MAX_PAGE_SIZE, PaginatedData } from '@/api/config/consts';
import { AppointmentsWithRelations } from '@/api/schema/appointments.schema';
import { DoctorOption } from '@/api/schema/doctors.schema';
import {
	formatPetTutorNames,
	PetsWithRelations,
} from '@/api/schema/pets.schema';
import { ServicesWithRelations } from '@/api/schema/services.schema';
import AddButton from '@/components/list/add-button';
import ConfirmAlertButton from '@/components/list/confirm-alert-dialog';
import DeleteAlertButton from '@/components/list/delete-alert-dialog';
import EditButton from '@/components/list/edit-button';
import SearchInput from '@/components/list/search-input';
import TableComponent from '@/components/list/table-component';
import LoadingDialog from '@/components/ui/loading';
import { Separator } from '@/components/ui/separator';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatCurrencyFromCents } from '@/helpers/currency';
import { handleNavigation } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';
import {
	ArrowRightIcon,
	BanIcon,
	ClockIcon,
	DollarSignIcon,
	DotIcon,
	PawPrintIcon,
	StethoscopeIcon,
	UserRoundIcon,
} from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useSearchParams } from 'next/navigation';
import { use } from 'react';
import { toast } from 'sonner';
import AppointmentFormClient from './appointment-form';
import BadgeStatus from './badge-status';

interface AppointmentsListClientProps {
	appointments: Promise<PaginatedData<AppointmentsWithRelations>>;
	pets: PetsWithRelations[];
	doctors: DoctorOption[];
	services: ServicesWithRelations[];
}

const AppointmentsListClient = ({
	appointments,
	pets,
	doctors,
	services,
}: AppointmentsListClientProps) => {
	const appointmentsResolved = use(appointments);
	const searchParams = useSearchParams();
	const { user } = useUser();
	const profile = user?.publicMetadata.role;

	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('page', page.toString());
		handleNavigation(params);
	};

	const handleDelete = (appointmentId: string) => {
		deleteAppointmentAction.execute({
			id: appointmentId,
		});
	};

	const deleteAppointmentAction = useAction(deleteAppointment, {
		onSuccess: () => {
			toast.success('Agendamento deletado com sucesso!');
		},
		onError: (err) => {
			console.error('Erro ao deletar agendamento:', err);
			toast.error(
				'Ocorreu um erro ao tentar deletar o agendamento. Tente novamente mais tarde.',
			);
		},
	});

	const handleConfirmAppointment = (appointmentId: string) => {
		markAsConfirmedAction.execute({
			id: appointmentId,
		});
	};

	const handleCompleteAppointment = (appointmentId: string) => {
		markAppointmentAsCompletedAction.execute({
			id: appointmentId,
		});
	};

	const markAsConfirmedAction = useAction(markAsConfirmed, {
		onSuccess: () => {
			toast.success('Agendamento confirmado com sucesso!');
		},
		onError: (err) => {
			console.error('Erro confirmar agendamento:', err);
			toast.error(
				'Ocorreu um erro ao tentar confirmar o agendamento. Tente novamente mais tarde.',
			);
		},
	});

	const markAppointmentAsCompletedAction = useAction(
		markAppointmentAsCompleted,
		{
			onSuccess: () => {
				toast.success('Agendamento concluído com sucesso!');
			},
			onError: (err) => {
				console.error('Erro concluir agendamento:', err);
				toast.error(
					'Ocorreu um erro ao tentar marcar o agendamento como concluído. Tente novamente mais tarde.',
				);
			},
		},
	);

	const handleCancelAppointment = (appointmentId: string) => {
		markAppointmentAsCancelledAction.execute({
			id: appointmentId,
		});
	};

	const markAppointmentAsCancelledAction = useAction(
		markAppointmentAsCancelled,
		{
			onSuccess: () => {
				toast.success('Agendamento cancelado com sucesso!');
			},
			onError: (err) => {
				console.error('Erro cancelar agendamento:', err);
				toast.error(
					'Ocorreu um erro ao tentar cancelar o agendamento. Tente novamente mais tarde.',
				);
			},
		},
	);

	const columns = [
		{ header: 'Data e hora', accessorKey: 'scheduledAt' },
		{ header: 'Paciente', accessorKey: 'pet' },
		{ header: 'Tutor(a)', accessorKey: 'tutor' },
		{ header: 'Status', accessorKey: 'status' },
		{ header: 'Serviço(s)', accessorKey: 'service' },
		{ header: 'Valor', accessorKey: 'totalPriceInCents' },
		{ header: 'Ações', accessorKey: 'actions' },
	];

	const renderRow = (appointment: AppointmentsWithRelations) => {
		return (
			<TableRow key={appointment.id}>
				<TableCell>
					{appointment.scheduledAt.toLocaleDateString('pt-BR')} às{' '}
					{appointment.scheduledAt.toLocaleTimeString('pt-BR', {
						hour: '2-digit',
						minute: '2-digit',
					})}
				</TableCell>
				<TableCell>{appointment.pet.name}</TableCell>
				<TableCell>{formatPetTutorNames(appointment.pet)}</TableCell>
				<TableCell>
					<BadgeStatus appointment={appointment} />
				</TableCell>
				<TableCell>
					<div className='flex flex-col gap-1'>
						{appointment.items.map((item) => (
							<div className='flex gap-2' key={item.serviceId}>
								<DotIcon className='w-4 h-4' />
								<p className='text-sm leading-tight'>
									{item.service.name} -{' '}
									{formatCurrencyFromCents(item.priceAtTimeInCents)}
								</p>
							</div>
						))}
					</div>
				</TableCell>
				<TableCell>
					{formatCurrencyFromCents(appointment.totalPriceInCents)}
				</TableCell>
				<TableCell className='w-20 space-x-2'>
					{(profile === 'admin' || profile === 'doctor') && (
						<>
							<ConfirmAlertButton
								size='icon'
								tooltip='Confirmar agendamento'
								disabled={appointment.status !== 'pending'}
								action={() => handleConfirmAppointment(appointment.id)}
							/>

							<DeleteAlertButton
								action={() => handleDelete(appointment.id)}
								tooltip='Deletar agendamento'
							/>
						</>
					)}

					<EditButton
						tooltip={'Editar agendamento'}
						disabled={appointment.status !== 'pending'}
						renderForm={(close) => (
							<AppointmentFormClient
								appointment={appointment}
								pets={pets}
								doctors={doctors}
								services={services}
								onSuccess={close}
							/>
						)}
					/>

					<DeleteAlertButton
						icon={<BanIcon />}
						disabled={appointment.status !== 'pending'}
						action={() => handleCancelAppointment(appointment.id)}
						tooltip='Cancelar agendamento'
					/>
				</TableCell>
			</TableRow>
		);
	};

	const renderMobile = (appointment: AppointmentsWithRelations) => {
		return (
			<div key={appointment.id} className='flex flex-col gap-4'>
				<div className='flex items-center justify-between'>
					<span className='flex flex-col gap-2'>
						<h3 className='font-bold'>
							{appointment.scheduledAt.toLocaleDateString('pt-BR')} -{' '}
							{appointment.pet.name}
						</h3>
						<BadgeStatus appointment={appointment} />
					</span>

					<span className='flex flex-col gap-2'>
						{(profile === 'admin' || profile === 'doctor') && (
							<>
								<ConfirmAlertButton
									size='icon'
									tooltip='Confirmar agendamento'
									disabled={appointment.status !== 'pending'}
									action={() => handleConfirmAppointment(appointment.id)}
								/>

								<DeleteAlertButton
									action={() => handleDelete(appointment.id)}
									tooltip='Deletar agendamento'
								/>
							</>
						)}

						<EditButton
							tooltip={'Editar agendamento'}
							renderForm={(close) => (
								<AppointmentFormClient
									appointment={appointment}
									pets={pets}
									doctors={doctors}
									services={services}
									onSuccess={close}
								/>
							)}
						/>

						<DeleteAlertButton
							icon={<BanIcon />}
							disabled={appointment.status !== 'pending'}
							action={() => handleCancelAppointment(appointment.id)}
							tooltip='Cancelar agendamento'
						/>
					</span>
				</div>

				<Separator />

				<div className='flex flex-col gap-2'>
					<p className='flex items-center gap-4'>
						<span className='text-sm font-semibold'>
							<PawPrintIcon className='w-4 h-4' />
						</span>
						<span className='text-sm'>{appointment.pet.name}</span>
					</p>
					<p className='flex items-center gap-4'>
						<span className='text-sm font-semibold'>
							<UserRoundIcon className='w-4 h-4' />
						</span>
						<span className='text-sm'>
							{formatPetTutorNames(appointment.pet)}
						</span>
					</p>
					<p className='flex items-center gap-4'>
						<span className='text-sm font-semibold'>
							<StethoscopeIcon className='w-4 h-4' />
						</span>
						<span className='text-sm'>{appointment.doctor.user.name}</span>
					</p>
					<p className='flex items-center gap-4'>
						<span className='text-sm font-semibold'>
							<ClockIcon className='w-4 h-4' />
						</span>
						<span className='text-sm'>
							{appointment.scheduledAt.toLocaleDateString('pt-BR')} às{' '}
							{appointment.scheduledAt.toLocaleTimeString('pt-BR', {
								hour: '2-digit',
								minute: '2-digit',
							})}
						</span>
					</p>
					<div className='flex items-start gap-4'>
						<span className='text-sm font-semibold'>
							<ArrowRightIcon className='w-4 h-4' />
						</span>
						<div className='flex flex-col gap-1'>
							{appointment.items.map((item) => (
								<div className='flex gap-2' key={item.serviceId}>
									<DotIcon className='w-4 h-4' />
									<p className='text-sm leading-tight'>
										{item.service.name} -{' '}
										{formatCurrencyFromCents(item.priceAtTimeInCents)}
									</p>
								</div>
							))}
						</div>
					</div>
					<p className='flex items-center gap-4'>
						<span className='text-sm font-semibold'>
							<DollarSignIcon className='w-4 h-5' />
						</span>
						<span className='text-sm'>
							{formatCurrencyFromCents(appointment.totalPriceInCents)}
						</span>
					</p>
				</div>

				{(profile === 'admin' || profile === 'doctor') && (
					<>
						<Separator />

						<ConfirmAlertButton
							text='Marcar como concluído'
							tooltip='Marcar como concluído'
							disabled={appointment.status !== 'pending'}
							action={() => handleCompleteAppointment(appointment.id)}
						/>
					</>
				)}
			</div>
		);
	};

	return (
		<div className='flex flex-col w-full gap-4'>
			<div className='flex flex-col items-center justify-between gap-4 lg:flex-row'>
				<SearchInput />

				<AddButton
					text='Adicionar Agendamento'
					renderForm={(close) => (
						<AppointmentFormClient
							pets={pets}
							doctors={doctors}
							services={services}
							onSuccess={close}
						/>
					)}
				/>
			</div>

			{(deleteAppointmentAction.isPending ||
				markAppointmentAsCancelledAction.isPending ||
				markAppointmentAsCompletedAction.isPending) && <LoadingDialog />}

			<TableComponent
				emptyMessage='Nenhum agendamento encontrado...'
				columns={columns}
				renderRow={renderRow}
				renderMobile={renderMobile}
				data={appointmentsResolved?.data}
				currentPage={appointmentsResolved?.metadata.currentPage}
				totalPages={appointmentsResolved?.metadata.pageCount}
				totalElements={appointmentsResolved?.metadata.totalCount}
				pageSize={MAX_PAGE_SIZE}
				onPageChange={handlePageChange}
			/>
		</div>
	);
};

export default AppointmentsListClient;

import { convertAppointmentStatus } from '@/api/config/consts';
import type { AppointmentsWithRelations } from '@/api/schema/appointments.schema';
import type { ShiftsWithRelations } from '@/api/schema/shifts.schema';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

interface DoctorDashboardProps {
	appointments: AppointmentsWithRelations[];
	shifts: ShiftsWithRelations[];
}

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
	timeZone: 'America/Campo_Grande',
	day: '2-digit',
	month: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
});

const DoctorDashboard = ({ appointments, shifts }: DoctorDashboardProps) => {
	const now = new Date();

	const pendingAppointments = appointments.filter(
		(appointment) => appointment.status === 'pending',
	);

	const inProgressAppointments = appointments.filter(
		(appointment) => appointment.status === 'in_progress',
	);

	const upcomingAppointments = appointments
		.filter(
			(appointment) =>
				appointment.scheduledAt >= now &&
				(appointment.status === 'pending' ||
					appointment.status === 'confirmed' ||
					appointment.status === 'in_progress'),
		)
		.slice()
		.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
		.slice(0, 5);

	const indicators = [
		{
			title: 'Agendamentos no mês',
			value: appointments.length,
		},
		{
			title: 'Pendentes',
			value: pendingAppointments.length,
		},
		{
			title: 'Em atendimento',
			value: inProgressAppointments.length,
		},
		{
			title: 'Plantões no mês',
			value: shifts.length,
		},
	];

	return (
		<div className='flex flex-col gap-6'>
			<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
				{indicators.map((indicator) => (
					<Card key={indicator.title}>
						<CardHeader>
							<CardDescription>{indicator.title}</CardDescription>

							<CardTitle className='text-3xl'>{indicator.value}</CardTitle>
						</CardHeader>
					</Card>
				))}
			</div>

			<Card>
				<CardHeader className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
					<div className='flex flex-col gap-2'>
						<CardTitle>Próximos atendimentos</CardTitle>

						<CardDescription>
							Agendamentos futuros do período consultado.
						</CardDescription>
					</div>

					<Button asChild variant='outline' size='sm'>
						<Link href='/appointments'>Ver todos</Link>
					</Button>
				</CardHeader>

				<CardContent className='flex flex-col gap-3'>
					{upcomingAppointments.length === 0 ? (
						<div className='rounded-lg border border-dashed p-6 text-center'>
							<p className='text-sm text-muted-foreground'>
								Nenhum atendimento futuro encontrado neste período.
							</p>
						</div>
					) : (
						upcomingAppointments.map((appointment) => (
							<Link
								key={appointment.id}
								href={`/pets/${appointment.petId}`}
								className='flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between'
							>
								<div className='flex flex-col gap-1'>
									<p className='font-semibold'>{appointment.pet.name}</p>

									<p className='text-xs text-muted-foreground'>
										{appointment.items
											.map((item) => item.service.name)
											.join(', ') || 'Atendimento'}
									</p>
								</div>

								<div className='flex flex-col gap-1 sm:items-end'>
									<p className='text-sm font-medium'>
										{dateTimeFormatter.format(appointment.scheduledAt)}
									</p>

									<p className='text-xs text-muted-foreground'>
										{convertAppointmentStatus(appointment.status)}
									</p>
								</div>
							</Link>
						))
					)}

					<div className='flex justify-end pt-2'>
						<Button asChild>
							<Link href='/agenda'>Abrir agenda</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default DoctorDashboard;

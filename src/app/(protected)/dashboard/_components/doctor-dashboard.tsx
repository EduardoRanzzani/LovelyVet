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
import { formatCurrencyFromCents } from '@/helpers/currency';
import { getDoctorShiftSummary } from '@/lib/dashboard/doctor-shift-summary';

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
	const shiftSummary = getDoctorShiftSummary(shifts, now);

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
			title: 'Plantões realizados',
			value: shiftSummary.completedCount,
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
					<div className='space-y-1'>
						<CardTitle>Controle de plantões</CardTitle>
						<CardDescription>
							Resumo financeiro dos plantões do período consultado.
						</CardDescription>
					</div>

					<Button asChild variant='outline' size='sm'>
						<Link href='/shifts'>Ver plantões</Link>
					</Button>
				</CardHeader>

				<CardContent className='space-y-5'>
					<div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
						{[
							{
								title: 'Realizados',
								value: String(shiftSummary.completedCount),
							},
							{
								title: 'Próximos',
								value: String(shiftSummary.upcomingCount),
							},
							{
								title: 'Recebido',
								value: formatCurrencyFromCents(shiftSummary.receivedInCents),
							},
							{
								title: 'A receber',
								value: formatCurrencyFromCents(shiftSummary.receivableInCents),
							},
						].map((item) => (
							<div key={item.title} className='min-w-0 rounded-lg border p-3'>
								<p className='text-xs text-muted-foreground'>{item.title}</p>
								<p className='mt-2 wrap-break-word text-lg font-bold tabular-nums sm:text-xl'>
									{item.value}
								</p>
							</div>
						))}
					</div>

					<div className='space-y-1 rounded-lg bg-muted/40 p-3'>
						<p className='text-sm font-semibold'>
							Previsão de plantões futuros
						</p>

						<p className='text-xl font-bold tabular-nums'>
							{formatCurrencyFromCents(shiftSummary.forecastInCents)}
						</p>

						<p className='text-xs text-muted-foreground'>
							Inclui plantões futuros já pagos. Não deve ser somada diretamente
							ao valor a receber.
						</p>
					</div>

					{shiftSummary.missingAmountCount > 0 && (
						<p className='text-xs text-amber-700 dark:text-amber-400'>
							{shiftSummary.missingAmountCount} plantão(ões) sem valor
							cadastrado. O resumo financeiro pode estar incompleto.
						</p>
					)}

					<div className='space-y-3'>
						<h3 className='font-semibold'>Próximos plantões</h3>

						{shiftSummary.upcomingShifts.length === 0 ? (
							<p className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
								Nenhum plantão futuro neste período.
							</p>
						) : (
							shiftSummary.upcomingShifts.slice(0, 5).map((shift) => (
								<Link
									key={shift.id}
									href='/shifts'
									className='flex min-h-16 flex-col gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:flex-row sm:items-center sm:justify-between'
								>
									<div className='min-w-0 space-y-1'>
										<p className='wrap-break-word font-semibold'>
											{shift.clinicName ?? 'Clínica não informada'}
										</p>

										<p className='text-xs text-muted-foreground'>
											Entrada:{' '}
											{dateTimeFormatter.format(new Date(shift.startTime))}
										</p>

										<p className='text-xs text-muted-foreground'>
											Saída: {dateTimeFormatter.format(new Date(shift.endTime))}
										</p>
									</div>

									<div className='shrink-0 sm:text-right'>
										<p className='font-semibold tabular-nums'>
											{shift.amountInCents === null
												? 'Valor não informado'
												: formatCurrencyFromCents(shift.amountInCents)}
										</p>

										<p className='text-xs text-muted-foreground'>
											{shift.isPaid ? 'Pago' : 'Não pago'}
										</p>
									</div>
								</Link>
							))
						)}
					</div>
				</CardContent>
			</Card>

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

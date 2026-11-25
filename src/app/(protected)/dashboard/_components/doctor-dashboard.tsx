'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
	CalendarDays,
	CalendarCheck,
	Clock3,
	Eye,
	EyeOff,
	Receipt,
	Wallet,
	Syringe,
	CheckCircle2,
	Stethoscope,
	ArrowUpRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrencyFromCents } from '@/helpers/currency';
import { FinanceMonthFilter } from '../../finance/_components/finance-month-filter';
import { appointmentCountLabel, reminderCountLabel, shiftCountLabel } from '@/lib/dashboard/doctor-dashboard';
import type { getDoctorDashboard } from '@/lib/dashboard/doctor-dashboard-queries';

type Data = Awaited<ReturnType<typeof getDoctorDashboard>>;
type RoutineAppointment = Data['routine']['today'][number];

const dateTime = new Intl.DateTimeFormat('pt-BR', {
	timeZone: 'America/Campo_Grande',
	day: '2-digit',
	month: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
});
const time = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Campo_Grande', hour: '2-digit', minute: '2-digit' });
const dateLabel = (date: string) => date.split('-').reverse().join('/');
const statusLabels: Record<string, string> = {
	pending: 'Pendente',
	confirmed: 'Confirmado',
	in_progress: 'Em atendimento',
	completed: 'Concluído',
	cancelled: 'Cancelado',
	no_show: 'Falta',
};

function Metric({
	label,
	value,
	Icon,
	hint,
}: {
	label: string;
	value: string | number;
	Icon: LucideIcon;
	hint?: string;
}) {
	return (
		<div className='flex min-w-0 flex-col gap-2 rounded-xl border bg-card p-3 shadow-sm sm:p-4'>
			<span className='flex size-8 items-center justify-center rounded-lg bg-primary/15'>
				<Icon className='size-4' aria-hidden='true' />
			</span>
			<p className='text-xs text-muted-foreground sm:text-sm'>{label}</p>
			<p className='mt-auto break-words text-lg font-bold tabular-nums sm:text-2xl'>{value}</p>
			{hint && <p className='text-xs text-muted-foreground'>{hint}</p>}
		</div>
	);
}

function SectionLink({ href, children }: { href: string; children: string }) {
	return (
		<Button asChild size='sm' variant='outline'>
			<Link href={href}>
				{children}
				<ArrowUpRight className='size-3' aria-hidden='true' />
			</Link>
		</Button>
	);
}

function Empty({ children }: { children: string }) {
	return <p className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>{children}</p>;
}

function AppointmentRow({ appointment, today = false }: { appointment: RoutineAppointment; today?: boolean }) {
	return (
		<Link
			href={`/pets/${appointment.petId}`}
			className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring'
		>
			<div className='min-w-0 flex-1 space-y-1'>
				<p className='break-words font-semibold'>{appointment.pet.name}</p>
				<p className='break-words text-xs text-muted-foreground'>
					{appointment.items.map((item) => item.service.name).join(', ') || 'Atendimento'}
				</p>
			</div>
			<div className='text-right text-sm'>
				<p className='font-medium tabular-nums'>
					{(today ? time : dateTime).format(new Date(appointment.scheduledAt))}
				</p>
				<p className='text-xs text-muted-foreground'>{statusLabels[appointment.status] ?? 'Não informado'}</p>
			</div>
		</Link>
	);
}

export default function DoctorDashboard({ data }: { data: Data }) {
	const [showValues, setShowValues] = useState(false);
	const money = (value: number) => (showValues ? formatCurrencyFromCents(value) : '••••');
	const { month, shifts, nextShifts, routine, reminders, appointments, pendingConfirmations } = data;
	return (
		<div className='@container min-w-0 space-y-6'>
			<FinanceMonthFilter selected={month} />
			<section aria-label='Plantões' className='space-y-3'>
				<div className='flex flex-wrap items-center justify-between gap-2'>
					<h2 className='text-lg font-semibold'>Controle de plantões</h2>
					<div className='flex flex-wrap gap-2'>
						<Button
							type='button'
							size='sm'
							variant='outline'
							aria-pressed={showValues}
							onClick={() => setShowValues((value) => !value)}
						>
							{showValues ? <EyeOff aria-hidden='true' /> : <Eye aria-hidden='true' />}
							{showValues ? 'Ocultar valores' : 'Mostrar valores'}
						</Button>
						<SectionLink href={`/shifts?month=${month}`}>Ver plantões</SectionLink>
					</div>
				</div>
				<div className='grid grid-cols-1 gap-2 @min-[300px]:grid-cols-2 @min-[900px]:grid-cols-4'>
					<Metric
						label='Recebido dos plantões realizados'
						value={money(shifts.receivedInCents)}
						Icon={Wallet}
					/>
					<Metric
						label='A receber dos plantões realizados'
						value={money(shifts.receivableInCents)}
						Icon={Receipt}
					/>
					<Metric
						label='Previsão dos plantões futuros'
						value={money(shifts.forecastInCents)}
						Icon={Clock3}
						hint={shiftCountLabel(shifts.upcomingCount)}
					/>
					<Metric
						label='Plantões realizados'
						value={shifts.completedCount}
						Icon={CalendarCheck}
						hint={`${shiftCountLabel(shifts.inProgressCount)} em andamento`}
					/>
				</div>
				<p className='text-xs text-muted-foreground'>
					Valores integrais dos plantões que intersectam o mês selecionado, conforme situação atual de
					pagamento. A previsão inclui plantões futuros já pagos e não deve ser somada ao valor a receber.
				</p>
				{shifts.prepaidInCents > 0 && (
					<p className='rounded-lg border p-3 text-sm'>
						Adiantamentos de plantões futuros ou em andamento:{' '}
						<strong>{money(shifts.prepaidInCents)}</strong>.
					</p>
				)}
				{shifts.missingAmountCount > 0 && (
					<p className='rounded-lg border p-3 text-sm text-amber-700'>
						{shiftCountLabel(shifts.missingAmountCount)} sem valor cadastrado. O resumo financeiro pode
						estar incompleto.
					</p>
				)}
				<div className='space-y-2 rounded-xl border bg-card p-3 sm:p-4'>
					<h3 className='font-semibold'>Próximos plantões</h3>
					<p className='text-xs text-muted-foreground'>
						Até cinco compromissos nos próximos 30 dias, independentemente do mês selecionado.
					</p>
					{nextShifts.length === 0 ? (
						<Empty>Nenhum plantão futuro nesse período.</Empty>
					) : (
						nextShifts.map((shift) => (
							<Link
								key={shift.id}
								href='/shifts'
								className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring'
							>
								<div className='min-w-0 flex-1 space-y-1'>
									<p className='break-words font-semibold'>
										{shift.clinicName || 'Clínica não informada'}
									</p>
									<p className='text-xs text-muted-foreground'>
										Entrada: {dateTime.format(new Date(shift.startTime))}
									</p>
									<p className='text-xs text-muted-foreground'>
										Saída: {dateTime.format(new Date(shift.endTime))}
									</p>
								</div>
								<div className='text-right'>
									<p className='text-sm font-semibold tabular-nums'>
										{shift.amountInCents === null
											? 'Valor não informado'
											: money(shift.amountInCents)}
									</p>
									<p className='text-xs text-muted-foreground'>
										{shift.isPaid ? 'Pago' : 'Não pago'}
									</p>
								</div>
							</Link>
						))
					)}
				</div>
			</section>
			<section aria-label='Agenda de hoje' className='space-y-3'>
				<div className='flex flex-wrap items-center justify-between gap-2'>
					<h2 className='text-lg font-semibold'>Agenda de hoje · {dateLabel(data.today)}</h2>
					<SectionLink href='/agenda'>Abrir agenda</SectionLink>
				</div>
				<div className='grid grid-cols-1 gap-2 @min-[300px]:grid-cols-2 @min-[900px]:grid-cols-4'>
					<Metric label='Aguardando confirmação' value={routine.pending} Icon={Clock3} />
					<Metric label='Confirmados' value={routine.confirmed} Icon={CalendarCheck} />
					<Metric label='Em atendimento' value={routine.inProgress} Icon={Stethoscope} />
					<Metric label='Concluídos' value={routine.completed} Icon={CheckCircle2} />
				</div>
				{routine.today.length === 0 ? (
					<Empty>Nenhum atendimento agendado para hoje.</Empty>
				) : (
					<div className='space-y-2 rounded-xl border bg-card p-3 sm:p-4'>
						<p className='text-xs text-muted-foreground'>
							{appointmentCountLabel(routine.today.length)} no dia, incluindo cancelados e faltas.
						</p>
						{routine.today.map((appointment) => (
							<AppointmentRow key={appointment.id} appointment={appointment} today />
						))}
					</div>
				)}
			</section>
			<section aria-label='Próximos atendimentos' className='space-y-3'>
				<div className='flex flex-wrap items-center justify-between gap-2'>
					<h2 className='text-lg font-semibold'>Próximos atendimentos</h2>
					<SectionLink href='/appointments'>Ver agendamentos</SectionLink>
				</div>
				<p className='text-xs text-muted-foreground'>
					Até cinco atendimentos pendentes ou confirmados, a partir de amanhã e dentro dos próximos 30 dias.
				</p>
				{routine.upcoming.length === 0 ? (
					<Empty>Nenhum atendimento futuro nesse período.</Empty>
				) : (
					routine.upcoming.map((appointment) => (
						<AppointmentRow key={appointment.id} appointment={appointment} />
					))
				)}
			</section>
			<section aria-label='Pendências clínicas' className='space-y-3'>
				<div className='flex flex-wrap items-center justify-between gap-2'>
					<h2 className='text-lg font-semibold'>Pendências clínicas</h2>
					<SectionLink href='/appointments'>Ver retornos e agendamentos</SectionLink>
				</div>
				<div className='grid grid-cols-1 gap-2 @min-[300px]:grid-cols-2 @min-[900px]:grid-cols-3'>
					<Metric
						label='Confirmações pendentes'
						value={pendingConfirmations}
						Icon={CalendarDays}
						hint='Todos os períodos'
					/>
					<Metric label='Retornos de vacinação vencidos' value={reminders.overdue} Icon={Syringe} />
					<Metric
						label='Retornos de vacinação próximos'
						value={reminders.upcoming}
						Icon={CalendarCheck}
						hint='Hoje e próximos dias, até 30 dias'
					/>
				</div>
				<p className='text-xs text-muted-foreground'>
					Retornos pendentes sem atendimento vinculado, de pacientes vivos. Exibindo até cinco, com os mais
					antigos primeiro.
				</p>
				{reminders.items.length === 0 ? (
					<Empty>Nenhum retorno de vacinação pendente nesse período.</Empty>
				) : (
					<div className='space-y-2 rounded-xl border bg-card p-3 sm:p-4'>
						<p className='text-xs text-muted-foreground'>
							{reminderCountLabel(reminders.overdue + reminders.upcoming)} sem agendamento
						</p>
						{reminders.items.map((reminder) => (
							<Link
								key={reminder.id}
								href={`/pets/${reminder.petId}`}
								className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring'
							>
								<div className='min-w-0 flex-1'>
									<p className='break-words font-semibold'>{reminder.petName}</p>
									<p className='break-words text-xs text-muted-foreground'>{reminder.title}</p>
								</div>
								<div className='text-right text-sm'>
									<p>{dateLabel(reminder.dueDate)}</p>
									<p
										className={
											reminder.dueDate < data.today
												? 'text-xs text-amber-700'
												: 'text-xs text-muted-foreground'
										}
									>
										{reminder.dueDate < data.today
											? 'Vencido'
											: reminder.dueDate === data.today
												? 'Hoje'
												: 'Previsto'}
									</p>
								</div>
							</Link>
						))}
					</div>
				)}
			</section>
			<section aria-label='Indicadores mensais' className='space-y-3'>
				<h2 className='text-lg font-semibold'>Atendimentos no mês de referência</h2>
				<div className='grid grid-cols-1 gap-2 @min-[300px]:grid-cols-2 @min-[900px]:grid-cols-4'>
					<Metric
						label='Agendamentos'
						value={appointments.total}
						Icon={CalendarDays}
						hint='Inclui cancelados e faltas'
					/>
					<Metric label='Concluídos' value={appointments.completed} Icon={CheckCircle2} />
					<Metric label='Confirmados' value={appointments.confirmed} Icon={CalendarCheck} />
					<Metric label='Pendentes' value={appointments.pending} Icon={Clock3} />
				</div>
			</section>
			<section className='space-y-3' aria-label='Acesso rápido'>
				<h2 className='text-lg font-semibold'>Acesso rápido</h2>
				<div className='flex flex-wrap gap-2'>
					<SectionLink href='/shifts'>Plantões</SectionLink>
					<SectionLink href='/agenda'>Agenda</SectionLink>
					<SectionLink href='/pets'>Pets</SectionLink>
					<SectionLink href='/appointments'>Agendamentos</SectionLink>
					<SectionLink href='/prescriptions'>Receitas</SectionLink>
					<SectionLink href='/calculators'>Calculadoras</SectionLink>
					<SectionLink href={`/finance?month=${month}`}>Financeiro dos atendimentos</SectionLink>
				</div>
			</section>
		</div>
	);
}

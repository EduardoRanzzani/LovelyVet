import Link from 'next/link';
import {
	ArrowRight,
	ArrowUpRight,
	CalendarDays,
	Cake,
	CheckCircle2,
	ChevronRight,
	Heart,
	PawPrint,
	Syringe,
	Wallet,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrencyFromCents } from '@/helpers/currency';
import { chargeCountLabel, getPetAgeLabel, petCountLabel } from '@/lib/dashboard/customer-dashboard';
import type { getCustomerDashboard } from '@/lib/dashboard/customer-dashboard-queries';

type Data = Awaited<ReturnType<typeof getCustomerDashboard>>;
const dateTime = new Intl.DateTimeFormat('pt-BR', {
	timeZone: 'America/Campo_Grande',
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
});
const longDate = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' });
const dateLabel = (date: string) => date.split('-').reverse().join('/');
const visibleCount = (count: number) => (count === 5 ? '5 exibidos' : String(count));

function SectionLink({ href, children }: { href: string; children: string }) {
	return (
		<Button asChild size='sm' variant='outline' className='max-w-full'>
			<Link href={href}>
				{children}
				<ArrowUpRight className='size-3' aria-hidden='true' />
			</Link>
		</Button>
	);
}
function Empty({ children }: { children: string }) {
	return (
		<div className='flex items-center gap-3 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground'>
			<CheckCircle2 className='size-5 shrink-0 text-emerald-700' aria-hidden='true' />
			<p>{children}</p>
		</div>
	);
}

export default function CustomerDashboard({ data, tutorName }: { data: Data; tutorName?: string | null }) {
	const firstName = tutorName?.trim().split(/\s+/)[0] || 'tutor';
	const birthdays = data.pets.filter(
		(pet) =>
			pet.status === 'alive' &&
			/^\d{4}-\d{2}-\d{2}$/.test(pet.birthDate) &&
			pet.birthDate <= data.today &&
			pet.birthDate.slice(5) === data.today.slice(5),
	);
	const hasOutstanding = data.outstandingCount > 0;
	const summary = [
		{ label: 'Meus pets', value: String(data.pets.length), href: '#meus-pets', icon: PawPrint },
		{
			label: 'Próximos atendimentos',
			value: visibleCount(data.appointments.length),
			href: '#proximos-atendimentos',
			icon: CalendarDays,
		},
		{
			label: 'Lembretes de vacinação',
			value: visibleCount(data.reminders.length),
			href: '#cuidados-vacinacao',
			icon: Syringe,
		},
	];
	return (
		<div className='@container min-w-0 space-y-6'>
			<section
				aria-label='Boas-vindas'
				className='relative overflow-hidden rounded-2xl border bg-card shadow-sm p-4 @min-[600px]:p-6'
			>
				<div
					className='pointer-events-none absolute -right-5 -top-5 text-muted-foreground/10'
					aria-hidden='true'
				>
					<PawPrint className='size-40 -rotate-12' />
				</div>
				<div className='relative space-y-1'>
					<p className='text-xs font-medium capitalize text-muted-foreground'>
						{longDate.format(new Date(`${data.today}T12:00:00Z`))}
					</p>
					<h2 className='break-words text-2xl font-semibold tracking-tight @min-[600px]:text-3xl'>
						Olá, {firstName}!
					</h2>
					<p className='text-sm text-muted-foreground'>Acompanhe de perto quem faz parte da sua família.</p>
				</div>
				<div className='relative mt-4 grid grid-cols-1 gap-2 @min-[340px]:grid-cols-3'>
					{summary.map(({ label, value, href, icon: Icon }) => (
						<a
							key={href}
							href={href}
							className='flex min-w-0 items-center gap-2 rounded-xl border border-border bg-muted/40 p-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring @min-[340px]:flex-col @min-[340px]:items-start @min-[650px]:flex-row @min-[650px]:items-center'
						>
							<Icon className='size-5 shrink-0 text-muted-foreground' aria-hidden='true' />
							<div className='min-w-0'>
								<p className='text-lg font-semibold tabular-nums leading-tight @min-[650px]:text-xl'>
									{value}
								</p>
								<p className='break-words text-xs text-muted-foreground'>{label}</p>
							</div>
						</a>
					))}
				</div>
				{(data.appointments.length === 5 || data.reminders.length === 5) && (
					<p className='relative mt-2 text-xs text-muted-foreground'>
						As listas mostram até cinco registros; consulte as respectivas telas para ver os demais.
					</p>
				)}
			</section>

			{birthdays.length > 0 && (
				<aside
					aria-label='Aniversários de hoje'
					className='flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950'
				>
					<Cake className='mt-0.5 size-5 shrink-0' aria-hidden='true' />
					<div className='min-w-0 space-y-1'>
						<p className='font-semibold'>Hoje é dia de comemorar!</p>
						{birthdays.map((pet) => (
							<p key={pet.id} className='break-words text-sm'>
								Feliz aniversário, {pet.name}!
							</p>
						))}
					</div>
				</aside>
			)}

			<section id='meus-pets' aria-label='Meus pets' className='scroll-mt-4 space-y-3'>
				<div className='flex flex-wrap items-center justify-between gap-2'>
					<div>
						<h2 className='text-lg font-semibold'>Meus pets</h2>
						<p className='text-xs text-muted-foreground'>{petCountLabel(data.pets.length)}</p>
					</div>
					<SectionLink href='/pets'>Ver meus pets</SectionLink>
				</div>
				{data.pets.length === 0 ? (
					<div className='flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground'>
						<PawPrint className='size-6 shrink-0' aria-hidden='true' />
						<p>Você ainda não possui pets vinculados. Entre em contato com a clínica.</p>
					</div>
				) : (
					<div className='grid grid-cols-1 gap-3 @min-[300px]:grid-cols-2 @min-[690px]:grid-cols-3 @min-[960px]:grid-cols-4'>
						{data.pets.map((pet) => (
							<Link
								key={pet.id}
								href={`/pets/${pet.id}`}
								className='group flex min-w-0 flex-col items-center gap-2 rounded-2xl border bg-card p-3 text-center shadow-sm transition-colors hover:border-emerald-300 hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring @min-[600px]:p-4'
							>
								<Avatar className='size-24 border-2 border-primary @min-[600px]:size-32'>
									<AvatarImage
										src={pet.photo || '/pet-placeholder.png'}
										alt=''
										className='object-cover'
									/>
									<AvatarFallback>
										<PawPrint className='size-10' aria-hidden='true' />
									</AvatarFallback>
								</Avatar>
								<div className='w-full min-w-0 space-y-1'>
									<p className='break-words text-base font-semibold'>{pet.name}</p>
									<p className='break-words text-xs text-muted-foreground'>
										{pet.species} · {pet.breed}
									</p>
								</div>
								{pet.status === 'alive' ? (
									<p className='text-xs text-muted-foreground'>
										{getPetAgeLabel(pet.birthDate, data.today)}
									</p>
								) : (
									<Badge variant='outline'>
										{pet.status === 'dead' ? 'Falecido' : 'Desaparecido'}
									</Badge>
								)}
								<span className='mt-auto flex w-full items-center justify-center gap-1 rounded-lg bg-muted/60 px-2 py-2 text-xs font-medium group-hover:bg-primary'>
									Ver perfil
									<ChevronRight className='size-3 shrink-0' aria-hidden='true' />
								</span>
							</Link>
						))}
					</div>
				)}
			</section>

			<div className='space-y-3'>
				<h2 className='text-lg font-semibold'>Acompanhamento dos meus pets</h2>
				<div className='grid min-w-0 grid-cols-1 gap-3 @min-[760px]:grid-cols-2'>
					<section
						id='proximos-atendimentos'
						aria-label='Próximos atendimentos'
						className='min-w-0 scroll-mt-4 space-y-3 rounded-2xl border bg-card p-4 shadow-sm'
					>
						<div className='flex flex-wrap items-center justify-between gap-2'>
							<h3 className='flex min-w-0 items-center gap-2 font-semibold'>
								<span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-appointment'>
									<CalendarDays className='size-5' aria-hidden='true' />
								</span>
								Próximos atendimentos
							</h3>
							<SectionLink href='/appointments'>Ver agendamentos</SectionLink>
						</div>
						<p className='text-xs text-muted-foreground'>Até cinco atendimentos nos próximos 30 dias.</p>
						{data.appointments.length === 0 ? (
							<Empty>Nenhum próximo atendimento agendado.</Empty>
						) : (
							data.appointments.map((item, index) => (
								<Link
									key={item.id}
									href={`/pets/${item.petId}`}
									className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${index === 0 ? 'border-emerald-200 bg-primary/40' : ''}`}
								>
									<div className='min-w-0 flex-1 basis-32'>
										{index === 0 && (
											<p className='mb-1 text-xs font-medium text-emerald-800'>
												Próximo compromisso
											</p>
										)}
										<p className='break-words font-semibold'>{item.petName}</p>
										<p className='text-sm text-muted-foreground'>
											{dateTime.format(new Date(item.scheduledAt))}
										</p>
									</div>
									<Badge
										variant='outline'
										className={
											item.status === 'confirmed'
												? 'border-emerald-200 bg-emerald-50 text-emerald-800'
												: 'border-amber-200 bg-amber-50 text-amber-900'
										}
									>
										{item.status === 'confirmed' ? 'Confirmado' : 'Aguardando confirmação'}
									</Badge>
								</Link>
							))
						)}
					</section>
					<section
						id='cuidados-vacinacao'
						aria-label='Cuidados e vacinação'
						className='min-w-0 scroll-mt-4 space-y-3 rounded-2xl border bg-card p-4 shadow-sm'
					>
						<div className='flex flex-wrap items-center justify-between gap-2'>
							<h3 className='flex min-w-0 items-center gap-2 font-semibold'>
								<span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-vaccine'>
									<Syringe className='size-5' aria-hidden='true' />
								</span>
								Cuidados e vacinação
							</h3>
							<SectionLink href='/pets'>Ver meus pets</SectionLink>
						</div>
						<p className='text-xs text-muted-foreground'>
							Até cinco lembretes pendentes, vencidos ou previstos para os próximos 30 dias.
						</p>
						{data.reminders.length === 0 ? (
							<Empty>Nenhum lembrete de vacinação pendente nesse período.</Empty>
						) : (
							data.reminders.map((item) => {
								const overdue = !item.appointmentId && item.dueDate < data.today;
								const dueToday = !item.appointmentId && item.dueDate === data.today;
								return (
									<Link
										key={item.id}
										href={`/pets/${item.petId}`}
										className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${overdue || dueToday ? 'border-amber-200 bg-amber-50/70' : ''}`}
									>
										<div className='min-w-0 flex-1 basis-32'>
											<p className='break-words font-semibold'>{item.title}</p>
											<p className='break-words text-sm text-muted-foreground'>
												{item.petName} · {dateLabel(item.dueDate)}
											</p>
										</div>
										<Badge
											variant='outline'
											className={
												overdue || dueToday
													? 'border-amber-300 text-amber-900'
													: item.appointmentId
														? 'border-emerald-200 bg-emerald-50 text-emerald-800'
														: undefined
											}
										>
											{item.appointmentId
												? 'Agendado'
												: overdue
													? 'Vencido'
													: dueToday
														? 'Hoje'
														: 'Previsto'}
										</Badge>
									</Link>
								);
							})
						)}
					</section>
				</div>
			</div>

			<section aria-label='Meu financeiro' className='rounded-2xl border bg-card p-4 shadow-sm'>
				<div className='flex flex-wrap items-center justify-between gap-4'>
					<div className='flex min-w-0 items-start gap-3'>
						<span className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary'>
							<Wallet className='size-5' aria-hidden='true' />
						</span>
						<div className='min-w-0 space-y-1'>
							<h2 className='font-semibold'>Meu financeiro</h2>
							<p className='text-xs text-muted-foreground'>Saldo total em aberto</p>
							<p className='break-words text-2xl font-bold tabular-nums'>
								{formatCurrencyFromCents(data.outstandingInCents)}
							</p>
							<p className='text-xs text-muted-foreground'>{chargeCountLabel(data.outstandingCount)}</p>
						</div>
					</div>
					<div className='flex min-w-0 flex-wrap items-center gap-3'>
						{!hasOutstanding && (
							<span className='flex items-center gap-1.5 text-sm font-medium text-emerald-800'>
								<CheckCircle2 className='size-4 shrink-0' aria-hidden='true' />
								Tudo em dia
							</span>
						)}
						<Button asChild variant='outline' size='sm'>
							<Link href='/my-finance'>
								Consultar meu financeiro
								<ArrowRight className='size-4' aria-hidden='true' />
							</Link>
						</Button>
					</div>
				</div>
				<p className='mt-3 border-t pt-3 text-xs text-muted-foreground'>
					Considera todo o histórico financeiro dos pets vinculados, inclusive cobranças compartilhadas com
					outros tutores.
				</p>
			</section>
			<p className='flex items-center justify-center gap-1.5 text-xs text-muted-foreground'>
				<Heart className='size-3.5 shrink-0' aria-hidden='true' />
				Cuidar é estar presente.
			</p>
		</div>
	);
}

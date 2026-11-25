'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
	CalendarDays,
	CalendarCheck,
	Clock3,
	Eye,
	EyeOff,
	PawPrint,
	Receipt,
	Stethoscope,
	Users,
	Wallet,
	Syringe,
	ArrowUpRight,
	CheckCircle2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrencyFromCents } from '@/helpers/currency';
import { FinanceMonthFilter } from '../../finance/_components/finance-month-filter';
import type { getAdminDashboard } from '@/lib/dashboard/admin-dashboard-queries';

type Data = Awaited<ReturnType<typeof getAdminDashboard>>;

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
		<section className='flex min-w-0 flex-col gap-2 rounded-xl border bg-card p-3 shadow-sm sm:p-4'>
			<span className='flex size-8 items-center justify-center rounded-lg bg-primary/15 text-foreground'>
				<Icon className='size-4' aria-hidden='true' />
			</span>
			<p className='text-xs text-muted-foreground sm:text-sm'>{label}</p>
			<p className='mt-auto break-words text-lg font-bold tabular-nums sm:text-2xl'>{value}</p>
			{hint && <p className='text-xs text-muted-foreground'>{hint}</p>}
		</section>
	);
}

function SectionLink({ href, label }: { href: string; label: string }) {
	return (
		<Button asChild size='sm' variant='outline'>
			<Link href={href}>
				{label}
				<ArrowUpRight className='size-3' aria-hidden='true' />
			</Link>
		</Button>
	);
}

const shiftCountLabel = (count: number) => `${count} ${count === 1 ? 'plantão' : 'plantões'}`;
const newCountLabel = (count: number) => `${count} ${count === 1 ? 'novo' : 'novos'} no mês`;

const monthLabel = (month: string) => `${month.slice(5)}/${month.slice(0, 4)}`;

export default function AdminDashboard({ data }: { data: Data }) {
	const [showValues, setShowValues] = useState(false);
	const money = (value: number) => (showValues ? formatCurrencyFromCents(value) : '••••');
	const { finance, appointments, registrations, pending, shifts, trend, month } = data;
	const maxAppointments = Math.max(1, ...trend.map((row) => row.completed));
	const maxMoney = Math.max(1, ...trend.flatMap((row) => [row.billed, row.received]));
	const financeHref = `/finance?month=${month}`;
	return (
		<div className='@container min-w-0 space-y-6'>
			<FinanceMonthFilter selected={month} />
			<section className='space-y-3' aria-label='Plantões'>
				<div className='flex flex-wrap items-center justify-between gap-2'>
					<h2 className='text-lg font-semibold'>Controle de plantões</h2>
					<div className='flex flex-wrap gap-2'>
						<Button
							variant='outline'
							size='sm'
							type='button'
							aria-pressed={showValues}
							onClick={() => setShowValues((value) => !value)}
						>
							{showValues ? <EyeOff aria-hidden='true' /> : <Eye aria-hidden='true' />}
							{showValues ? 'Ocultar valores' : 'Mostrar valores'}
						</Button>
						<SectionLink href={`/shifts?month=${month}`} label='Ver plantões' />
					</div>
				</div>
				<div className='grid grid-cols-1 gap-2 @min-[300px]:grid-cols-2 @min-[900px]:grid-cols-4'>
					<Metric label='Valor total dos plantões' value={money(shifts.total)} Icon={Receipt} />
					<Metric label='Plantões marcados como pagos' value={money(shifts.paid)} Icon={Wallet} />
					<Metric
						label='Plantões não pagos'
						value={money(shifts.unpaid)}
						Icon={Clock3}
						hint={shiftCountLabel(shifts.unpaidCount)}
					/>
					<Metric label='Plantões sem valor informado' value={shifts.missingAmount} Icon={CalendarDays} />
				</div>
				<p className='text-xs text-muted-foreground'>
					Plantões que intersectam o mês. Valores integrais, sem rateio entre meses, conforme situação atual
					de pagamento. Não compõem o faturamento de atendimentos.
				</p>
				{shifts.clinics.length === 0 ? (
					<p className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
						Nenhum plantão no período.
					</p>
				) : (
					shifts.clinics.map((clinic) => (
						<details key={clinic.name} className='rounded-xl border bg-card p-3'>
							<summary className='cursor-pointer break-words text-sm font-semibold'>
								{clinic.name} · {shiftCountLabel(clinic.count)}
							</summary>
							<p className='mt-2 text-xs'>
								Total: {money(clinic.total)} · Não pago: {money(clinic.unpaid)}
							</p>
							<div className='mt-2 divide-y'>
								{clinic.requesters.map((requester) => (
									<div
										key={requester.name}
										className='flex flex-wrap justify-between gap-2 py-2 text-xs'
									>
										<span className='break-words'>
											{requester.name} · {shiftCountLabel(requester.count)}
										</span>
										<span>
											{money(requester.total)} · Não pago: {money(requester.unpaid)}
										</span>
									</div>
								))}
							</div>
						</details>
					))
				)}
			</section>
			<section className='space-y-3' aria-label='Financeiro dos atendimentos'>
				<div className='flex flex-wrap items-center justify-between gap-2'>
					<h2 className='text-lg font-semibold'>Financeiro dos atendimentos</h2>
					<div className='flex flex-wrap gap-2'>
						<SectionLink href={financeHref} label='Ver financeiro' />
					</div>
				</div>
				<div className='grid grid-cols-1 gap-2 @min-[300px]:grid-cols-2 @min-[900px]:grid-cols-4'>
					<Metric label='Faturado no mês' value={money(finance.billedInCents)} Icon={Receipt} />
					<Metric label='Recebido no mês' value={money(finance.receivedInCents)} Icon={Wallet} />
					<Metric label='Saldo total em aberto' value={money(finance.outstandingInCents)} Icon={Clock3} />
					<Metric label='Cobranças válidas no mês' value={finance.invoicedCount} Icon={Receipt} />
				</div>
				<p className='text-xs text-muted-foreground'>
					Faturamento e recebimentos do mês selecionado. Saldo atual de todo o histórico, sem plantões.
				</p>
			</section>
			<section className='space-y-3' aria-label='Indicadores operacionais'>
				<div className='flex flex-wrap items-center justify-between gap-2'>
					<h2 className='text-lg font-semibold'>Operação e cadastros</h2>
					<SectionLink href={`/appointments?month=${month}`} label='Ver agendamentos' />
				</div>
				<div className='grid grid-cols-1 gap-2 @min-[300px]:grid-cols-2 @min-[900px]:grid-cols-3'>
					<Metric
						label='Agendamentos no mês'
						value={appointments.total}
						Icon={CalendarDays}
						hint='Inclui cancelados e faltas'
					/>
					<Metric label='Atendimentos concluídos no mês' value={appointments.completed} Icon={CheckCircle2} />
					<Metric label='Plantões no mês' value={shifts.count} Icon={CalendarCheck} />
					<Metric
						label='Pets cadastrados'
						value={registrations.pets}
						Icon={PawPrint}
						hint={newCountLabel(registrations.newPets)}
					/>
					<Metric
						label='Tutores cadastrados'
						value={registrations.customers}
						Icon={Users}
						hint={newCountLabel(registrations.newCustomers)}
					/>
					<Metric label='Veterinários cadastrados' value={registrations.doctors} Icon={Stethoscope} />
				</div>
				<p className='text-xs text-muted-foreground'>
					Cadastros: totais atuais. Agendamentos agrupados pela data agendada, não pela data de criação.
				</p>
			</section>
			<div className='grid min-w-0 gap-3 @min-[900px]:grid-cols-2'>
				<section className='min-w-0 space-y-4 rounded-xl border bg-card p-4 shadow-sm'>
					<h2 className='font-semibold'>Atendimentos concluídos</h2>
					<p className='text-xs text-muted-foreground'>Até seis meses, incluindo o mês de referência.</p>
					{trend.map((row) => (
						<div
							key={row.month}
							className='grid grid-cols-[4rem_minmax(0,1fr)_2rem] items-center gap-2 text-xs'
						>
							<span>{monthLabel(row.month)}</span>
							<div className='h-3 rounded-full bg-muted' aria-hidden='true'>
								<div
									className='h-full rounded-full bg-emerald-600'
									style={{ width: `${(row.completed / maxAppointments) * 100}%` }}
								/>
							</div>
							<span className='text-right font-medium tabular-nums'>{row.completed}</span>
						</div>
					))}
				</section>
				<section className='min-w-0 space-y-4 rounded-xl border bg-card p-4 shadow-sm'>
					<h2 className='font-semibold'>Evolução financeira</h2>
					<p className='text-xs text-muted-foreground'>Faturado e recebido por mês, sem plantões.</p>
					{showValues ? (
						<>
							<div className='flex flex-wrap gap-3 text-xs'>
								<span className='flex items-center gap-1'>
									<span className='size-3 rounded bg-slate-500' /> Faturado
								</span>
								<span className='flex items-center gap-1'>
									<span className='size-3 rounded bg-emerald-600' /> Recebido
								</span>
							</div>
							{trend.map((row) => (
								<div key={row.month} className='space-y-1 text-xs'>
									<p className='font-medium'>{monthLabel(row.month)}</p>
									{[
										{ label: 'Faturado', amount: row.billed, color: 'bg-slate-500' },
										{ label: 'Recebido', amount: row.received, color: 'bg-emerald-600' },
									].map((item) => (
										<div
											key={item.label}
											className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2'
										>
											<div className='h-2 rounded-full bg-muted' aria-hidden='true'>
												<div
													className={`h-full rounded-full ${item.color}`}
													style={{ width: `${(item.amount / maxMoney) * 100}%` }}
												/>
											</div>
											<span
												className='tabular-nums'
												aria-label={`${item.label}: ${money(item.amount)}`}
											>
												{money(item.amount)}
											</span>
										</div>
									))}
								</div>
							))}
						</>
					) : (
						<p className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
							Valores ocultos. Utilize Mostrar valores para consultar a evolução financeira.
						</p>
					)}
				</section>
			</div>
			<section className='space-y-3' aria-label='Pendências operacionais'>
				<h2 className='text-lg font-semibold'>Pendências operacionais</h2>
				<div className='grid gap-2 @min-[700px]:grid-cols-3'>
					{[
						{
							label: 'Agendamentos aguardando confirmação',
							value: pending.confirmations,
							Icon: CalendarCheck,
							href: '/appointments',
							hint: 'Todos os períodos',
						},
						{
							label: 'Retornos sem agendamento',
							value: pending.reminders,
							Icon: Syringe,
							href: `/appointments?month=${month}`,
							hint: 'Vencidos ou previstos até o fim do mês selecionado',
						},
						{
							label: 'Cobranças com saldo em aberto',
							value: pending.charges,
							Icon: Receipt,
							href: financeHref,
							hint: 'Todos os períodos',
						},
					].map(({ label, value, Icon, href, hint }) => (
						<Link
							key={label}
							href={href}
							className='rounded-xl border bg-card p-4 shadow-sm hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-primary'
						>
							<div className='flex items-center justify-between gap-2'>
								<Icon className='size-5 text-muted-foreground' aria-hidden='true' />
								<span className='text-xl font-bold'>{value}</span>
							</div>
							<p className='mt-2 text-sm font-medium'>{label}</p>
							<p className='mt-1 text-xs text-muted-foreground'>{hint}</p>
						</Link>
					))}
				</div>
			</section>
			<section className='space-y-3'>
				<h2 className='text-lg font-semibold'>Acesso rápido</h2>
				<div className='flex flex-wrap gap-2'>
					{[
						{ href: '/agenda', label: 'Agenda' },
						{ href: '/pets', label: 'Pets' },
						{ href: '/customers', label: 'Clientes' },
						{ href: '/doctors', label: 'Veterinários' },
						{ href: '/shifts', label: 'Plantões' },
						{ href: financeHref, label: 'Financeiro' },
					].map((item) => (
						<SectionLink key={item.href} {...item} />
					))}
				</div>
			</section>
		</div>
	);
}

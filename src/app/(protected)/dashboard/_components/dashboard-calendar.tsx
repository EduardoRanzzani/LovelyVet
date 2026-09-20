// _components/dashboard-calendar-client.tsx
'use client';

import { monthNames } from '@/api/config/consts';
import { AppointmentsWithRelations } from '@/api/schema/appointments.schema';
import { formatPetTutorNames } from '@/api/schema/pets.schema';
import { ShiftsWithRelations } from '@/api/schema/shifts.schema';
import { CustomCalendar } from '@/components/ui/custom-calendar';
import { cn } from '@/lib/utils';
import {
	endOfDay,
	format,
	isSameDay,
	isWithinInterval,
	setMonth,
	startOfDay,
} from 'date-fns';
import {
	ClockIcon,
	HospitalIcon,
	MoonIcon,
	StethoscopeIcon,
	SunIcon,
	UserIcon,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface DashboardCalendarProps {
	shifts: ShiftsWithRelations[];
	appointments: AppointmentsWithRelations[];
}

const DashboardCalendarClient = ({
	shifts,
	appointments,
}: DashboardCalendarProps) => {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const monthParam = searchParams.get('month');
	const currentMonth = monthParam
		? setMonth(new Date(), monthNames.indexOf(monthParam.toLowerCase()))
		: new Date();

	const handleMonthChange = (newDate: Date) => {
		const monthIndex = newDate.getMonth();
		const monthName = monthNames[monthIndex];

		const params = new URLSearchParams(searchParams);
		params.set('month', monthName);

		router.push(`${pathname}?${params.toString()}`);
	};

	const renderDayContent = (
		date: Date,
		isMobile: boolean,
		isCurrentMonth: boolean,
	) => {
		// Filtro de Plantões
		const dayShifts = shifts.filter((s) => {
			const start = new Date(s.startTime);
			const end = new Date(s.endTime);

			// Verifica se o dia atual do calendário está entre o início e o fim do plantão
			return isWithinInterval(date, {
				start: startOfDay(start),
				end: endOfDay(end),
			});
		});

		// Filtro de Agendamentos
		const dayAppointments = appointments.filter((a) =>
			isSameDay(new Date(a.scheduledAt), date),
		);

		return (
			<div
				className={cn(
					'flex flex-col gap-1 mt-1 transition-opacity',
					!isCurrentMonth && 'opacity-30 grayscale-[0.5] pointer-events-none',
				)}
			>
				{/* Render Agendamentos */}
				{dayAppointments.map((appo) => (
					<div
						key={appo.id}
						className={cn(
							'group relative flex flex-col p-1.5 text-[10px] border-l-2 transition-colors rounded-sm',
							'bg-emerald-500 text-emerald-950 border-emerald-700 hover:bg-emerald-500/90',
						)}
					>
						<div className='font-bold text-center mb-2'>
							<h1>Agendamento</h1>
						</div>

						<div className='overflow-x-auto'>
							<span className='flex items-center gap-2'>
								<StethoscopeIcon className='w-3 h-3' />
								<p className='truncate'>{appo.pet?.name}</p>
							</span>
							<span className='flex items-center gap-2'>
								<ClockIcon className='w-3 h-3' />
								<p className='truncate'>
									{format(new Date(appo.scheduledAt), 'HH:mm')}
								</p>
							</span>
							<span className='flex items-center gap-2'>
								<UserIcon className='w-3 h-3' />
								<p className='truncate'>
									{appo.pet ? formatPetTutorNames(appo.pet) : ''}
								</p>
							</span>
						</div>
					</div>
				))}

				{/* Render Plantões */}
				{dayShifts.map((shift) => {
					const startDate = new Date(shift.startTime);
					const isStart = isSameDay(new Date(shift.startTime), date);
					const isEnd = isSameDay(new Date(shift.endTime), date);

					const startHour = startDate.getHours();
					const isNight = startHour >= 18 || startHour < 6;

					return (
						<div
							key={shift.id}
							onClick={(e) => {
								e.stopPropagation();
							}}
							className={cn(
								'group relative flex flex-col p-1.5 text-[10px] border-l-2 transition-colors rounded-sm',
								isNight
									? 'bg-blue-950 text-blue-200 border-indigo-600 hover:bg-blue-950/90'
									: 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-100/90',
								!isStart && 'opacity-70 border-dashed',
							)}
						>
							<div className='font-bold text-center mb-2'>
								<h1>Plantão</h1>
							</div>
							<div className='font-bold truncate'>
								<span
									className={cn(
										isNight ? 'text-blue-200' : 'text-amber-700',
										'flex items-center gap-2',
									)}
								>
									{isNight ? (
										<MoonIcon className='w-3 h-3' />
									) : (
										<SunIcon className='w-3 h-3' />
									)}
									{shift.clinicName}
								</span>
							</div>

							<div className='text-muted-foreground flex items-center gap-2'>
								<span
									className={cn(
										isNight ? 'text-blue-200' : 'text-amber-700',
										'flex items-center gap-2',
									)}
								>
									<ClockIcon className='w-3 h-3' />
									{isStart
										? 'Entrada: ' + format(new Date(shift.startTime), 'HH:mm')
										: ''}
									{isStart && isEnd && ' - '}
									{isEnd
										? 'Saída: ' + format(new Date(shift.endTime), 'HH:mm')
										: ''}
									{!isStart && !isEnd && 'Continuação'}
								</span>
							</div>
						</div>
					);
				})}
			</div>
		);
	};

	const renderMobileContent = (date: Date, isCurrentMonth: boolean) => {
		const dayShifts = shifts.filter((shift) => {
			const start = new Date(shift.startTime);
			return isSameDay(date, start);
		});

		const dayAppointments = appointments.filter((a) =>
			isSameDay(new Date(a.scheduledAt), date),
		);

		return (
			<div
				className={cn(
					'flex flex-col gap-1 mt-1 transition-opacity',
					!isCurrentMonth && 'opacity-30 grayscale-[0.5] pointer-events-none',
				)}
			>
				{/* Render Agendamentos */}
				{dayAppointments.map((appo) => (
					<div
						key={appo.id}
						className={cn(
							'group relative flex flex-col p-1.5 text-[10px] border-l-2 transition-colors rounded-sm',
							'bg-emerald-500 text-emerald-950 border-emerald-700 hover:bg-emerald-500/90',
						)}
					>
						<span className='flex gap-2'>
							<StethoscopeIcon className='w-3 h-3' />
							<ClockIcon className='w-3 h-3' />
						</span>
					</div>
				))}

				{dayShifts.map((shift) => {
					const startDate = new Date(shift.startTime);
					const startHour = startDate.getHours();
					const isNight = startHour >= 18 || startHour < 6;

					return (
						<div
							key={shift.id}
							className={cn(
								'group relative flex flex-col p-1.5 text-[10px] border-l-2 transition-colors rounded-sm',
								isNight
									? 'bg-blue-950 text-blue-200 border-indigo-600 hover:bg-blue-950/90'
									: 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-100/90',
							)}
						>
							<span className='flex gap-2'>
								{isNight ? (
									<MoonIcon className='w-3 h-3' />
								) : (
									<SunIcon className='w-3 h-3' />
								)}
								<HospitalIcon className='w-3 h-3' />
							</span>
						</div>
					);
				})}
			</div>
		);
	};

	return (
		<CustomCalendar
			currentMonth={currentMonth}
			onMonthChange={handleMonthChange}
			renderDay={renderDayContent}
			renderMobileHeader={renderMobileContent}
			onDayClick={(date) => console.log('Clicou:', date)}
			// Passamos as datas que possuem qualquer evento para marcar no calendário
			onDutyDates={[
				...shifts.map((s) => new Date(s.startTime)),
				...appointments.map((a) => new Date(a.scheduledAt)),
			]}
		/>
	);
};

export default DashboardCalendarClient;

'use client';

import { monthNames } from '@/api/config/consts';
import { DoctorsWithRelations } from '@/api/schema/doctors.schema';
import { ShiftsWithRelations } from '@/api/schema/shifts.schema';
import { CustomCalendar } from '@/components/ui/custom-calendar';
import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
	endOfDay,
	format,
	isSameDay,
	isWithinInterval,
	setMonth,
	startOfDay,
} from 'date-fns';
import { ClockIcon, HospitalIcon, MoonIcon, SunIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { use, useMemo, useState } from 'react';
import ShiftFormClient from './shift-form';

interface ShiftsCalendarClientProps {
	shiftsPromise: Promise<ShiftsWithRelations[]>;
	doctors: DoctorsWithRelations[];
}

const ShiftsCalendarClient = ({
	shiftsPromise,
	doctors,
}: ShiftsCalendarClientProps) => {
	const shifts = use(shiftsPromise);
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [selectedShift, setSelectedShift] = useState<
		ShiftsWithRelations | undefined
	>(undefined);

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

	const handleEditShift = (shift: ShiftsWithRelations) => {
		setSelectedShift(shift);
		setSelectedDate(null); // Limpa a data selecionada da grid para não confundir
		setIsFormOpen(true);
	};

	const onDutyDates = useMemo(() => {
		const uniqueStartDates = new Set(
			shifts.map((shift) =>
				startOfDay(new Date(shift.startTime)).toISOString(),
			),
		);
		return Array.from(uniqueStartDates).map((dateStr) => new Date(dateStr));
	}, [shifts]);

	const renderMobileContent = (date: Date, isCurrentMonth: boolean) => {
		const dayShifts = shifts.filter((shift) => {
			const start = new Date(shift.startTime);
			return isSameDay(date, start);
		});

		return (
			<div
				className={cn(
					'flex flex-col gap-1 mt-1 transition-opacity',
					!isCurrentMonth && 'opacity-30 grayscale-[0.5] pointer-events-none',
				)}
			>
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

	const renderDayContent = (
		date: Date,
		isMobile: boolean,
		isCurrentMonth: boolean,
		onEdit: (shift: ShiftsWithRelations) => void,
	) => {
		const dayShifts = shifts
			.filter((shift) => {
				const start = new Date(shift.startTime);
				const end = new Date(shift.endTime);

				// Verifica se o dia atual do calendário está entre o início e o fim do plantão
				return isWithinInterval(date, {
					start: startOfDay(start),
					end: endOfDay(end),
				});
			})
			.sort((a, b) => {
				const timeA = new Date(a.startTime).getTime();
				const timeB = new Date(b.startTime).getTime();
				return timeA - timeB;
			});

		return (
			<div
				className={cn(
					'flex flex-col gap-1 mt-1 transition-opacity',
					!isCurrentMonth && 'opacity-30 grayscale-[0.5] pointer-events-none',
				)}
			>
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
								onEdit(shift);
							}}
							className={cn(
								'group relative flex flex-col p-1.5 text-[10px] border-l-2 transition-colors rounded-sm',
								isNight
									? 'bg-blue-950 text-blue-200 border-indigo-600 hover:bg-blue-950/90'
									: 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-100/90',
								!isStart && 'opacity-70 border-dashed',
							)}
						>
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
									<span className='truncate'>{shift.clinicName}</span>
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

	return (
		<div className='flex flex-col w-full gap-4'>
			<Dialog
				open={isFormOpen}
				onOpenChange={(open) => {
					setIsFormOpen(open);
					if (!open) {
						setSelectedShift(undefined);
						setSelectedDate(null);
					}
				}}
			>
				<CustomCalendar
					currentMonth={currentMonth}
					onMonthChange={handleMonthChange}
					renderDay={(date, isMobile, isCurrentMonth) =>
						renderDayContent(date, isMobile, isCurrentMonth, handleEditShift)
					}
					renderMobileHeader={renderMobileContent}
					onDutyDates={onDutyDates}
					onDayClick={(date) => {
						setSelectedDate(date);
						setIsFormOpen(true);
					}}
				/>

				{isFormOpen && (
					<ShiftFormClient
						key={
							selectedShift?.id || selectedDate?.toISOString() || 'new-shift'
						}
						shift={selectedShift}
						doctors={doctors}
						selectedDate={selectedDate}
						onSuccess={() => {
							setIsFormOpen(false);
							setSelectedShift(undefined);
							setSelectedDate(null);
						}}
					/>
				)}
			</Dialog>
		</div>
	);
};

export default ShiftsCalendarClient;

'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
	addMonths,
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	isSameDay,
	isSameMonth,
	startOfDay,
	startOfMonth,
	startOfWeek,
	subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { ReactNode, useEffect, useMemo, useState } from 'react';

interface CustomCalendarProps {
	currentMonth: Date;
	onMonthChange: (date: Date) => void;
	renderMobileHeader?: (date: Date, isCurrentMonth: boolean) => ReactNode;
	renderDay: (date: Date, isMobile: boolean, isCurrentMonth: boolean) => ReactNode;
	onDayClick?: (date: Date) => void;
	onDutyDates?: Date[]; // Lista de dias que têm plantão
	className?: string;
	showDetails?: boolean;
}

export function CustomCalendar({
	currentMonth,
	onMonthChange,
	renderMobileHeader,
	renderDay,
	onDayClick,
	onDutyDates = [],
	className,
	showDetails,
}: CustomCalendarProps) {
	// 1. Corrigido: Inicializar isMobile como false e só mudar no useEffect
	// Isso evita o erro de "Hydration failed"
	const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
	const [isMobile, setIsMobile] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [lastClickTime, setLastClickTime] = useState(0);

	useEffect(() => {
		const mount = () => {
			setMounted(true);
		};

		mount();
		const checkMobile = () => setIsMobile(window.innerWidth < 768);
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// 2. Memoizar os dias para evitar cálculos desnecessários em cada re-render
	const calendarDays = useMemo(() => {
		const monthStart = startOfMonth(currentMonth);
		const monthEnd = endOfMonth(monthStart);
		const startDate = startOfWeek(monthStart);
		const endDate = endOfWeek(monthEnd);
		return eachDayOfInterval({ start: startDate, end: endDate });
	}, [currentMonth]);

	// Se não estiver montado no cliente ainda, renderizamos um placeholder ou versão estática
	// para evitar o erro de mismatch do Next.js
	if (!mounted) return <div className='w-full h-100 bg-muted animate-pulse rounded-xl' />;

	const weekdays = isMobile ? ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] : ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

	return (
		<div className={cn('w-full bg-card border rounded-xl overflow-hidden shadow-sm flex flex-col', className)}>
			{/* Header */}
			<div className='flex items-center justify-between p-4 border-b bg-muted/10'>
				<h2 className='text-lg font-bold capitalize'>{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h2>
				<div className='flex gap-2'>
					<Button
						variant='outline'
						size='icon'
						className='h-8 w-8'
						onClick={() => onMonthChange(subMonths(currentMonth, 1))}
					>
						<ChevronLeft className='w-4 h-4' />
					</Button>
					<Button
						variant='outline'
						size='icon'
						className='h-8 w-8'
						onClick={() => onMonthChange(addMonths(currentMonth, 1))}
					>
						<ChevronRight className='w-4 h-4' />
					</Button>
				</div>
			</div>

			{/* Dias da Semana */}
			<div className='grid grid-cols-7 border-b bg-muted/30'>
				{weekdays.map((day, i) => (
					<div key={i} className='py-2 text-center text-[10px] font-bold text-muted-foreground uppercase'>
						{day}
					</div>
				))}
			</div>

			{/* Grid de Células */}
			<div className='grid grid-cols-7'>
				{calendarDays.map((day, idx) => {
					const isSelected = isSameDay(day, selectedDate);
					const isToday = isSameDay(day, new Date());
					const isCurrentMonth = isSameMonth(day, currentMonth);

					const hasDuty = onDutyDates.some((dutyDate) => isSameDay(dutyDate, day));

					return (
						<div
							key={day.toISOString()}
							onClick={() => {
								const d = startOfDay(day);

								if (!isMobile) {
									onDayClick?.(d); // No desktop abre direto
									return;
								}

								const now = Date.now();
								const DOUBLE_CLICK_THRESHOLD = 300;

								setSelectedDate(d);

								if (now - lastClickTime < DOUBLE_CLICK_THRESHOLD) {
									onDayClick?.(d);
									setLastClickTime(0);
								} else {
									setLastClickTime(now);
								}
							}}
							className={cn(
								'relative transition-colors flex flex-col border-b border-r',
								'min-h-15 md:min-h-20 p-1 md:p-2',
								!isCurrentMonth && 'bg-muted/5 text-muted-foreground/40',
								idx % 7 === 6 && 'border-r-0',
								isMobile && isSelected && 'bg-primary/5 ring-1 ring-inset ring-primary/30',
								'cursor-pointer hover:bg-muted/10',
							)}
						>
							<span
								className={cn(
									'text-xs md:text-sm font-medium w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full mb-1',
									isToday && 'bg-primary text-primary-foreground shadow-sm',
									!isToday && isSelected && isMobile && 'bg-accent text-accent-foreground',
								)}
							>
								{format(day, 'd')}
							</span>

							{/* Marcador de Plantão (Badge/Dot) */}
							{hasDuty && (
								<div
									className={cn(
										'flex items-center',
										!isCurrentMonth && 'opacity-30',
										isMobile ? 'block' : 'hidden',
									)}
								>
									{renderMobileHeader?.(day, isCurrentMonth)}
								</div>
							)}

							<div
								className={cn(
									'flex-1 overflow-hidden',
									isMobile ? 'hidden' : 'block', // No mobile, escondemos o conteúdo interno para focar no painel inferior
								)}
							>
								{renderDay(day, isMobile, isCurrentMonth)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Painel de Detalhes Mobile */}
			{(isMobile || showDetails) && (
				<div className='p-4 border-t bg-background mt-auto'>
					<div className='flex items-center justify-between mb-3'>
						<div className='flex items-center gap-2 text-sm font-semibold'>
							<CalendarIcon className='w-4 h-4' />
							{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
						</div>
						{/* Feedback para o usuário saber que pode adicionar */}
						<span className='text-[10px] text-muted-foreground italic'>
							Toque duplo no dia para adicionar
						</span>
					</div>
					<div className='min-h-25'>{renderDay(selectedDate, true, true)}</div>
				</div>
			)}
		</div>
	);
}

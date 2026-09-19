'use client';

import { getCalendarEventDetails } from '@/api/actions/calendar-events.actions';
import { monthNames } from '@/api/config/consts';
import type { CalendarEntry } from '@/api/schema/calendar.schema';
import type { DoctorsWithRelations } from '@/api/schema/doctors.schema';
import { CustomCalendar } from '@/components/ui/custom-calendar';
import { Dialog } from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
	eachDayOfInterval,
	endOfDay,
	format,
	isSameDay,
	isWithinInterval,
	parseISO,
	startOfDay,
} from 'date-fns';
import {
	BellIcon,
	CalendarClockIcon,
	ClockIcon,
	HospitalIcon,
	StethoscopeIcon,
} from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { use, useMemo, useState } from 'react';
import { toast } from 'sonner';
import CalendarEventForm, {
	type PersonalCalendarEventDetails,
} from './calendar-event-form';
import LoadingDialog from '@/components/ui/loading';

interface AgendaCalendarClientProps {
	entriesPromise: Promise<CalendarEntry[]>;
	doctors: DoctorsWithRelations[];
	viewerRole: 'admin' | 'doctor';
	viewerDoctorId: string | null;
	selectedDoctorId?: string;
}

const AgendaCalendarClient = ({
	entriesPromise,
	doctors,
	viewerRole,
	viewerDoctorId,
	selectedDoctorId,
}: AgendaCalendarClientProps) => {
	const entries = use(entriesPromise);

	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const [isFormOpen, setIsFormOpen] = useState(false);

	const [selectedDate, setSelectedDate] = useState<Date | null>(null);

	const [selectedPersonalEvent, setSelectedPersonalEvent] = useState<
		PersonalCalendarEventDetails | undefined
	>();

	const monthParam = searchParams.get('month');

	const yearParam = Number(searchParams.get('year'));

	const now = new Date();

	const monthIndex = monthParam
		? monthNames.indexOf(monthParam.toLowerCase())
		: now.getMonth();

	const safeMonthIndex = monthIndex >= 0 ? monthIndex : now.getMonth();

	const safeYear =
		Number.isInteger(yearParam) && yearParam > 0
			? yearParam
			: now.getFullYear();

	const currentMonth = new Date(safeYear, safeMonthIndex, 1);

	const eventDetailsAction = useAction(getCalendarEventDetails, {
		onSuccess: ({ data }) => {
			if (!data) return;

			setSelectedPersonalEvent({
				id: data.id,
				doctorId: data.doctorId,
				title: data.title,
				startTime: new Date(data.startTime),
				endTime: new Date(data.endTime),
				notes: data.notes,
			});

			setSelectedDate(null);
			setIsFormOpen(true);
		},

		onError: ({ error }) => {
			toast.error(
				error.serverError ?? 'Não foi possível carregar o compromisso.',
			);
		},
	});

	const handleMonthChange = (newDate: Date) => {
		const params = new URLSearchParams(searchParams);

		params.set('month', monthNames[newDate.getMonth()]);

		params.set('year', String(newDate.getFullYear()));

		router.push(`${pathname}?${params.toString()}`);
	};

	const handleDoctorChange = (doctorId: string) => {
		const params = new URLSearchParams(searchParams);

		if (doctorId === 'all') {
			params.delete('doctor');
		} else {
			params.set('doctor', doctorId);
		}

		router.push(`${pathname}?${params.toString()}`);
	};

	const handleNewEvent = (date: Date) => {
		setSelectedPersonalEvent(undefined);
		setSelectedDate(date);
		setIsFormOpen(true);
	};

	const handleEditPersonalEvent = (id: string) => {
		eventDetailsAction.execute({ id });
	};

	const handleFormSuccess = () => {
		setIsFormOpen(false);
		setSelectedDate(null);
		setSelectedPersonalEvent(undefined);

		router.refresh();
	};

	const getEntriesForDay = (date: Date) => {
		return entries
			.filter((entry) => {
				if (entry.kind === 'care_reminder') {
					return isSameDay(parseISO(entry.dueDate), date);
				}

				const start = new Date(entry.startAt);

				const end = entry.endAt ? new Date(entry.endAt) : start;

				return isWithinInterval(date, {
					start: startOfDay(start),
					end: endOfDay(end),
				});
			})
			.sort((a, b) => {
				if (a.kind === 'care_reminder') {
					return 1;
				}

				if (b.kind === 'care_reminder') {
					return -1;
				}

				return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
			});
	};

	const markedDates = useMemo(() => {
		const dates: Date[] = [];

		for (const entry of entries) {
			if (entry.kind === 'care_reminder') {
				dates.push(startOfDay(parseISO(entry.dueDate)));

				continue;
			}

			const start = startOfDay(new Date(entry.startAt));

			const end = startOfDay(entry.endAt ? new Date(entry.endAt) : start);

			dates.push(
				...eachDayOfInterval({
					start,
					end,
				}),
			);
		}

		const unique = new Map<string, Date>();

		for (const date of dates) {
			unique.set(date.toISOString(), date);
		}

		return [...unique.values()];
	}, [entries]);

	const renderEntryIcon = (entry: CalendarEntry) => {
		switch (entry.kind) {
			case 'appointment':
				return <StethoscopeIcon className='size-3' />;

			case 'shift':
				return <HospitalIcon className='size-3' />;

			case 'personal':
				return <CalendarClockIcon className='size-3' />;

			case 'care_reminder':
				return <BellIcon className='size-3' />;
		}
	};

	const renderEntry = (entry: CalendarEntry, date: Date) => {
		const isPersonal = entry.kind === 'personal';

		const isStart =
			entry.kind !== 'care_reminder' &&
			isSameDay(new Date(entry.startAt), date);

		const className =
			entry.kind === 'appointment'
				? 'border-primary/50 bg-primary/10'
				: entry.kind === 'shift'
					? 'border-amber-500/50 bg-amber-500/10'
					: entry.kind === 'personal'
						? 'border-violet-500/50 bg-violet-500/10'
						: 'border-emerald-500/50 bg-emerald-500/10';

		return (
			<div
				key={`${entry.kind}-${entry.id}`}
				onClick={(event) => {
					event.stopPropagation();

					if (isPersonal) {
						handleEditPersonalEvent(entry.id);
					}
				}}
				className={cn(
					'rounded-sm border-l-2 p-1.5 text-[10px]',
					className,
					isPersonal && 'cursor-pointer hover:opacity-80',
					entry.kind === 'appointment' && !entry.blocksSchedule && 'opacity-50',
				)}
			>
				<div className='flex items-center gap-1 font-semibold'>
					{renderEntryIcon(entry)}

					<span className='truncate'>{entry.title}</span>
				</div>

				{entry.kind === 'care_reminder' ? (
					<div className='mt-1 truncate text-muted-foreground'>
						{entry.pet.name}
					</div>
				) : (
					<div className='mt-1 flex items-center gap-1 text-muted-foreground'>
						<ClockIcon className='size-3' />

						{isStart ? format(new Date(entry.startAt), 'HH:mm') : 'Continuação'}
					</div>
				)}
			</div>
		);
	};

	const renderDay = (
		date: Date,
		_isMobile: boolean,
		isCurrentMonth: boolean,
	) => {
		const dayEntries = getEntriesForDay(date);

		return (
			<div
				className={cn(
					'mt-1 flex flex-col gap-1',
					!isCurrentMonth && 'pointer-events-none opacity-30',
				)}
			>
				{dayEntries.map((entry) => renderEntry(entry, date))}

				{dayEntries.length === 0 && (
					<span className='px-1 text-[10px] text-muted-foreground/50'>
						Livre
					</span>
				)}
			</div>
		);
	};

	const renderMobileHeader = (date: Date, isCurrentMonth: boolean) => {
		const dayEntries = getEntriesForDay(date);

		return (
			<div
				className={cn('flex flex-wrap gap-1', !isCurrentMonth && 'opacity-30')}
			>
				{dayEntries.slice(0, 4).map((entry) => (
					<span key={`${entry.kind}-${entry.id}`}>
						{renderEntryIcon(entry)}
					</span>
				))}
			</div>
		);
	};

	return (
		<div className='flex w-full flex-col gap-4'>
			<div className='flex flex-col justify-between gap-3 md:flex-row md:items-center'>
				<div className='flex flex-wrap gap-3 text-xs text-muted-foreground'>
					<span className='flex items-center gap-1'>
						<StethoscopeIcon className='size-4' />
						Atendimento
					</span>

					<span className='flex items-center gap-1'>
						<HospitalIcon className='size-4' />
						Plantão
					</span>

					<span className='flex items-center gap-1'>
						<CalendarClockIcon className='size-4' />
						Pessoal
					</span>

					<span className='flex items-center gap-1'>
						<BellIcon className='size-4' />
						Lembrete
					</span>
				</div>

				{viewerRole === 'admin' && (
					<Select
						value={selectedDoctorId ?? 'all'}
						onValueChange={handleDoctorChange}
					>
						<SelectTrigger className='w-full md:w-64'>
							<SelectValue placeholder='Veterinário' />
						</SelectTrigger>

						<SelectContent>
							<SelectItem value='all'>Todos os veterinários</SelectItem>

							{doctors.map((doctor) => (
								<SelectItem key={doctor.id} value={doctor.id}>
									{doctor.user.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			</div>

			<Dialog
				open={isFormOpen}
				onOpenChange={(open) => {
					setIsFormOpen(open);

					if (!open) {
						setSelectedDate(null);
						setSelectedPersonalEvent(undefined);
					}
				}}
			>
				<CustomCalendar
					currentMonth={currentMonth}
					onMonthChange={handleMonthChange}
					renderDay={renderDay}
					renderMobileHeader={renderMobileHeader}
					onDutyDates={markedDates}
					onDayClick={handleNewEvent}
				/>

				{isFormOpen && (
					<CalendarEventForm
						key={
							selectedPersonalEvent?.id ??
							selectedDate?.toISOString() ??
							'new-calendar-event'
						}
						event={selectedPersonalEvent}
						doctors={doctors}
						selectedDate={selectedDate}
						selectedDoctorId={selectedDoctorId}
						viewerRole={viewerRole}
						viewerDoctorId={viewerDoctorId}
						onSuccess={handleFormSuccess}
					/>
				)}
			</Dialog>

			{eventDetailsAction.isPending && <LoadingDialog />}
		</div>
	);
};

export default AgendaCalendarClient;

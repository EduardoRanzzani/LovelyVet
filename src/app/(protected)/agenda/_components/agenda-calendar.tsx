'use client';

import {
	deleteCalendarEvent,
	getCalendarEventDetails,
} from '@/api/actions/calendar-events.actions';
import { monthNames } from '@/api/config/consts';
import type {
	CalendarCareReminderEntry,
	CalendarEntry,
} from '@/api/schema/calendar.schema';
import type { DoctorsWithRelations } from '@/api/schema/doctors.schema';
import { CustomCalendar } from '@/components/ui/custom-calendar';
import DeleteAlertButton from '@/components/list/delete-alert-dialog';
import { Dialog } from '@/components/ui/dialog';
import LoadingDialog from '@/components/ui/loading';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { getCalendarEntryTimeLabel } from '@/lib/agenda/calendar-entry-time';
import { getCareReminderStatusUI } from '@/lib/agenda/care-reminder-status';
import {
	getMobileCalendarIndicatorClass,
	getMobileCalendarVisibleCount,
} from '@/lib/agenda/mobile-calendar-indicators';
import {
	isNightShift,
	startsOnCalendarDay,
} from '@/lib/agenda/shift-calendar-presentation';
import { cn } from '@/lib/utils';
import {
	eachDayOfInterval,
	endOfDay,
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
	MoonIcon,
	StethoscopeIcon,
	SunIcon,
} from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { use, useMemo, useState } from 'react';
import { toast } from 'sonner';
import CalendarEventForm, {
	type PersonalCalendarEventDetails,
} from './calendar-event-form';
import CareReminderDialog from './care-reminder-dialog';

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
	const [selectedCareReminder, setSelectedCareReminder] = useState<
		CalendarCareReminderEntry | undefined
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

	const deleteEventAction = useAction(deleteCalendarEvent, {
		onSuccess: () => {
			toast.success('Compromisso excluído com sucesso.');
			router.refresh();
		},
		onError: ({ error }) => {
			toast.error(
				error.serverError ?? 'Não foi possível excluir o compromisso.',
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
		params.set('doctor', doctorId);
		router.push(`${pathname}?${params.toString()}`);
	};

	const handleNewEvent = (date: Date) => {
		setSelectedCareReminder(undefined);
		setSelectedPersonalEvent(undefined);
		setSelectedDate(date);
		setIsFormOpen(true);
	};

	const handleCareReminder = (reminder: CalendarCareReminderEntry) => {
		setSelectedPersonalEvent(undefined);
		setSelectedDate(null);
		setSelectedCareReminder(reminder);
		setIsFormOpen(true);
	};

	const handleEditPersonalEvent = (id: string) => {
		setSelectedCareReminder(undefined);
		eventDetailsAction.execute({ id });
	};

	const handleFormSuccess = () => {
		setIsFormOpen(false);
		setSelectedDate(null);
		setSelectedPersonalEvent(undefined);
		setSelectedCareReminder(undefined);

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
				return (
					<span className='inline-flex shrink-0 items-center gap-1'>
						{isNightShift(entry.startAt) ? (
							<MoonIcon className='size-3' />
						) : (
							<SunIcon className='size-3' />
						)}

						<HospitalIcon className='size-3' />
					</span>
				);

			case 'personal':
				return <CalendarClockIcon className='size-3' />;

			case 'care_reminder':
				return <BellIcon className='size-3' />;
		}
	};

	const renderEntry = (entry: CalendarEntry, date: Date) => {
		const reminderUI =
			entry.kind === 'care_reminder'
				? getCareReminderStatusUI(entry.status)
				: null;

		const isShiftStart =
			entry.kind === 'shift' && isSameDay(new Date(entry.startAt), date);

		const className =
			entry.kind === 'appointment'
				? 'border-primary/50 bg-primary/10'
				: entry.kind === 'shift'
					? isNightShift(entry.startAt)
						? 'bg-blue-950 text-blue-200 border-indigo-600 hover:bg-blue-950/90'
						: 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-100/90'
					: entry.kind === 'personal'
						? 'border-violet-500/50 bg-violet-500/10'
						: (reminderUI?.cardClassName ?? '');

		return (
			<div
				key={`${entry.kind}-${entry.id}`}
				onClick={(event) => {
					event.stopPropagation();

					if (entry.kind === 'personal') {
						handleEditPersonalEvent(entry.id);
						return;
					}

					if (entry.kind === 'care_reminder') {
						handleCareReminder(entry);
					}
				}}
				className={cn(
					'rounded-md border-l-2 p-2 text-xs md:p-1.5 md:text-[10px]',
					className,
					entry.kind === 'shift' && !isShiftStart && 'opacity-70 border-dashed',
					(entry.kind === 'personal' || entry.kind === 'care_reminder') &&
						'cursor-pointer transition-opacity hover:opacity-80 active:opacity-60',
					entry.kind === 'appointment' && !entry.blocksSchedule && 'opacity-50',
				)}
			>
				<div className='flex min-w-0 items-start gap-1.5 font-semibold'>
					<span className='mt-0.5 shrink-0'>{renderEntryIcon(entry)}</span>

					<span
						className={cn(
							'min-w-0 flex-1 wrap-break-word',
							reminderUI?.titleClassName,
						)}
					>
						{entry.title}
					</span>

					{entry.kind === 'personal' && (
						<div
							className='ml-auto shrink-0'
							onClick={(event) => event.stopPropagation()}
						>
							<DeleteAlertButton
								tooltip='Excluir compromisso'
								disabled={deleteEventAction.isPending}
								action={() =>
									deleteEventAction.execute({
										id: entry.id,
									})
								}
							/>
						</div>
					)}
				</div>

				{entry.kind === 'care_reminder' ? (
					<div className='mt-1 flex min-w-0 flex-col gap-1'>
						<span className='wrap-break-word text-muted-foreground'>
							{entry.pet.name}
						</span>

						<span
							className={cn(
								'w-fit max-w-full rounded border px-1.5 py-0.5 text-[10px] font-medium',
								reminderUI?.badgeClassName,
							)}
						>
							{reminderUI?.label}
						</span>
					</div>
				) : (
					<div
						className={cn(
							'mt-1 flex items-center gap-1 text-[11px]',
							entry.kind === 'shift'
								? isNightShift(entry.startAt)
									? 'text-blue-200'
									: 'text-amber-800'
								: 'text-muted-foreground',
						)}
					>
						<ClockIcon className='size-3' />
						{getCalendarEntryTimeLabel(
							new Date(entry.startAt),
							entry.endAt ? new Date(entry.endAt) : null,
							date,
						)}
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
		const dayEntries = getEntriesForDay(date).filter(
			(entry) =>
				entry.kind !== 'shift' || startsOnCalendarDay(entry.startAt, date),
		);

		const { visible, remaining } = getMobileCalendarVisibleCount(
			dayEntries.length,
		);

		return (
			<div
				className={cn(
					'flex w-full min-w-0 flex-wrap items-center gap-0.5',
					!isCurrentMonth && 'opacity-30',
				)}
			>
				{dayEntries.slice(0, visible).map((entry) => {
					const isShift = entry.kind === 'shift';

					const nightShift = isShift && isNightShift(entry.startAt);

					return (
						<span
							key={`${entry.kind}-${entry.id}`}
							title={entry.title}
							className={cn(
								'inline-flex min-h-5 items-center justify-center rounded-sm border-l-2 p-1',
								isShift ? 'w-full gap-1.5' : 'size-5 shrink-0',
								isShift
									? nightShift
										? 'border-indigo-600 bg-blue-950 text-blue-200'
										: 'border-amber-400 bg-amber-100 text-amber-900'
									: getMobileCalendarIndicatorClass(entry),
							)}
						>
							{isShift ? (
								<>
									{nightShift ? (
										<MoonIcon className='size-3 shrink-0' />
									) : (
										<SunIcon className='size-3 shrink-0' />
									)}

									<HospitalIcon className='size-3 shrink-0' />
								</>
							) : (
								renderEntryIcon(entry)
							)}
						</span>
					);
				})}

				{remaining > 0 && (
					<span
						className='flex min-h-5 items-center rounded-sm bg-muted px-1 text-[9px] font-semibold text-foreground'
						aria-label={`Mais ${remaining} eventos neste dia`}
					>
						+{remaining}
					</span>
				)}
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
						setSelectedCareReminder(undefined);
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

				{isFormOpen && selectedCareReminder && (
					<CareReminderDialog
						reminder={selectedCareReminder}
						onSuccess={handleFormSuccess}
					/>
				)}

				{isFormOpen && !selectedCareReminder && (
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

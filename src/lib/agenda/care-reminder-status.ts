import type { CalendarCareReminderEntry } from '@/api/schema/calendar.schema';

type ReminderStatus = CalendarCareReminderEntry['status'];

export const getCareReminderStatusUI = (status: ReminderStatus) => {
	switch (status) {
		case 'completed':
			return {
				label: 'Concluído',
				cardClassName: 'border-emerald-500/50 bg-emerald-500/10',
				titleClassName: 'text-emerald-700 dark:text-emerald-400',
				detailClassName: 'text-muted-foreground',
				badgeClassName:
					'border-emerald-500/40 text-emerald-700 dark:text-emerald-400',
			};

		case 'cancelled':
			return {
				label: 'Cancelado',
				cardClassName: 'border-border bg-muted/50 opacity-75',
				titleClassName: 'text-muted-foreground line-through decoration-1',
				detailClassName: 'text-muted-foreground',
				badgeClassName: 'border-border text-muted-foreground',
			};

		case 'pending':
			return {
				label: 'Pendente',
				cardClassName: 'border-amber-500/50 bg-amber-500/10',
				titleClassName: 'text-foreground',
				detailClassName: 'text-muted-foreground',
				badgeClassName:
					'border-amber-500/40 text-amber-700 dark:text-amber-400',
			};
	}
};

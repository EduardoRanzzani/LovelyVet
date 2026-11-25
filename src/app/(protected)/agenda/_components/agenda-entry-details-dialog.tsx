'use client';

import type { CalendarAppointmentEntry, CalendarShiftEntry } from '@/api/schema/calendar.schema';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getAgendaEntryDetails } from '@/lib/agenda/agenda-entry-details';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDaysIcon, ClockIcon, PawPrintIcon } from 'lucide-react';
import Link from 'next/link';

type Props = {
	entry: CalendarAppointmentEntry | CalendarShiftEntry;
};

const formatDate = (date: Date) => format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

export default function AgendaEntryDetailsDialog({ entry }: Props) {
	const details = getAgendaEntryDetails(entry);

	return (
		<DialogContent className='max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-lg'>
			<DialogHeader className='pr-5 text-left'>
				<DialogTitle className='break-words'>{entry.title}</DialogTitle>
				<DialogDescription>{details.typeLabel}</DialogDescription>
			</DialogHeader>

			<div className='space-y-3 text-sm'>
				<div className='rounded-lg border p-3'>
					<p className='mb-2 flex items-center gap-2 font-medium'>
						<CalendarDaysIcon className='size-4' /> Data e horário
					</p>
					<p className='flex items-center gap-2'>
						<ClockIcon className='size-4 shrink-0' /> Entrada: {formatDate(entry.startAt)}
					</p>
					{entry.endAt && <p className='mt-1 pl-6'>Saída: {formatDate(entry.endAt)}</p>}
				</div>

				{entry.kind === 'appointment' && (
					<>
						<div className='rounded-lg border p-3'>
							<p className='mb-2 flex items-center gap-2 font-medium'>
								<PawPrintIcon className='size-4' /> Paciente
							</p>
							<Link
								className='inline-flex min-h-11 items-center font-semibold text-foreground underline underline-offset-4 hover:text-primary'
								href={`/pets/${encodeURIComponent(entry.pet.id)}`}
							>
								{entry.pet.name}
							</Link>
						</div>
						<div className='rounded-lg border p-3'>
							<p className='font-medium'>Serviços</p>
							{entry.services.length > 0 ? (
								<ul className='mt-2 list-inside list-disc space-y-1'>
									{entry.services.map((name, index) => (
										<li key={`${name}-${index}`} className='break-words'>
											{name}
										</li>
									))}
								</ul>
							) : (
								<p className='mt-2 text-muted-foreground'>Nenhum serviço informado.</p>
							)}
							<p className='mt-2 text-xs text-muted-foreground'>Status: {details.statusLabel}</p>
						</div>
					</>
				)}

				{entry.kind === 'shift' && (
					<div className='rounded-lg border p-3'>
						<p className='font-medium'>Plantão</p>
						<p className='mt-1 break-words'>{entry.title}</p>
						<p className='mt-1 text-xs text-muted-foreground'>{details.shiftLabel}</p>
					</div>
				)}
			</div>

			<DialogFooter>
				<Button asChild className='min-h-11 w-full sm:w-auto'>
					<Link href={details.listHref}>Abrir {details.typeLabel.toLowerCase()}</Link>
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}

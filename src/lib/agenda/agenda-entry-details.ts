import type {
  CalendarAppointmentEntry,
  CalendarShiftEntry,
} from '@/api/schema/calendar.schema';

export const getAgendaEntryDetails = (
  entry: CalendarAppointmentEntry | CalendarShiftEntry,
) => {
  if (entry.kind === 'shift') {
    const hour = new Date(entry.startAt).getHours();
    return {
      typeLabel: 'Plantão',
      listHref: '/shifts',
      statusLabel: null,
      shiftLabel: hour >= 18 || hour < 6 ? 'Noturno' : 'Diurno',
    };
  }

  const statusLabels: Record<CalendarAppointmentEntry['status'], string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    in_progress: 'Em atendimento',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    no_show: 'Não compareceu',
  };

  return {
    typeLabel: 'Atendimento',
    listHref: '/appointments',
    statusLabel: statusLabels[entry.status] ?? entry.status,
    shiftLabel: null,
  };
};

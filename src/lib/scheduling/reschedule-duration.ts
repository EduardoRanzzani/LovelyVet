type ScheduledServices = {
	scheduledAt: Date;
	endsAt: Date | null;
	items: { service: { durationMinutes: number } }[];
};

// Mantém a reserva histórica e inclui serviços acrescentados posteriormente.
// A duração de cada serviço é contabilizada uma vez, como no agendamento original.
export function getRescheduleDurationMinutes(appointment: ScheduledServices): number {
	const reserved = appointment.endsAt
		? Math.ceil((appointment.endsAt.getTime() - appointment.scheduledAt.getTime()) / 60_000)
		: 0;
	const services = appointment.items.reduce((sum, item) => sum + item.service.durationMinutes, 0);
	return Math.max(reserved, services, 0) || 30;
}

import type { AppointmentListItem } from '@/api/schema/appointments.schema';

/** Mantém a descrição curta na listagem; o detalhe conserva os itens e valores completos. */
export function summarizeAppointmentItems(appointment: Pick<AppointmentListItem, 'items' | 'productItems'>): string {
  const names = [
    ...appointment.items.map((item) => item.service.name),
    ...(appointment.productItems ?? []).map((item) => item.product.name),
  ];
  if (names.length === 0) return 'Sem itens';
  if (names.length === 1) return names[0];
  return `${names[0]} + ${names.length - 1} ${names.length === 2 ? 'item' : 'itens'}`;
}

export const isStaff = (role: string) => role === 'admin' || role === 'doctor';

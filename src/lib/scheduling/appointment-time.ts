/**
 * Remove segundos e milissegundos do horário selecionado.
 *
 * Exemplo:
 * 09:00:37.420 -> 09:00:00.000
 *
 * Evita falsos conflitos entre agendamentos consecutivos.
 */
export const normalizeAppointmentStart = (date: Date): Date => {
	const normalized = new Date(date);

	normalized.setSeconds(0, 0);

	return normalized;
};

export const getNextAppointmentSlot = (baseDate: Date = new Date()): Date => {
	const date = normalizeAppointmentStart(baseDate);

	const minutes = date.getMinutes();
	const nextMinutes = Math.ceil(minutes / 5) * 5;

	date.setMinutes(nextMinutes);

	return date;
};

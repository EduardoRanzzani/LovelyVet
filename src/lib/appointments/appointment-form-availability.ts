/** Validação de disponibilidade no formulário; o backend revalida antes de gravar. */
export function getAppointmentAvailabilityError({
	isCheckingAvailability,
	availableTimes,
	unchangedSchedule,
	selectedTime,
}: {
	isCheckingAvailability: boolean;
	availableTimes: string[] | undefined;
	unchangedSchedule: boolean;
	selectedTime: string;
}): string | null {
	if (isCheckingAvailability) {
		return 'Aguarde a verificação da disponibilidade antes de salvar.';
	}

	if (availableTimes === undefined && !unchangedSchedule) {
		return 'Aguarde a verificação da disponibilidade antes de salvar.';
	}

	if (availableTimes && !availableTimes.includes(selectedTime)) {
		return 'O horário selecionado não está mais disponível.';
	}

	return null;
}

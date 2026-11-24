import { describe, expect, it } from 'vitest';
import { getAppointmentAvailabilityError } from './appointment-form-availability';

describe('validação de disponibilidade do formulário', () => {
	const base = {
		isCheckingAvailability: false,
		availableTimes: ['09:00', '09:30'],
		unchangedSchedule: false,
		selectedTime: '09:00',
	};

	it('permite salvar com horário validado', () => {
		expect(getAppointmentAvailabilityError(base)).toBeNull();
	});

	it('bloqueia envio enquanto uma nova consulta está pendente, mesmo havendo resposta anterior', () => {
		expect(getAppointmentAvailabilityError({ ...base, isCheckingAvailability: true }))
			.toContain('Aguarde');
	});

	it('bloqueia nova marcação sem disponibilidade consultada', () => {
		expect(getAppointmentAvailabilityError({ ...base, availableTimes: undefined }))
			.toContain('Aguarde');
	});

	it('permite edição sem mudança de horário, serviços ou veterinário quando ainda não houve consulta', () => {
		expect(getAppointmentAvailabilityError({
			...base,
			availableTimes: undefined,
			unchangedSchedule: true,
		})).toBeNull();
	});

	it('bloqueia um horário não presente na disponibilidade retornada', () => {
		expect(getAppointmentAvailabilityError({ ...base, selectedTime: '10:00' }))
			.toContain('não está mais disponível');
	});

	it('bloqueia dia sem horários disponíveis', () => {
		expect(getAppointmentAvailabilityError({ ...base, availableTimes: [] }))
			.toContain('não está mais disponível');
	});
});

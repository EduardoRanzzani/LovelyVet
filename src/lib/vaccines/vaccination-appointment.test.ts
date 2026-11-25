import { describe, expect, it } from 'vitest';
import { appointmentPriceForVaccination, vaccinationAppointmentNotes } from './vaccination-appointment';

describe('appointmentPriceForVaccination', () => {
	const now = new Date(2026, 10, 23, 11);
	it('usa o preço em centavos para aplicações realizadas hoje', () => {
		expect(appointmentPriceForVaccination(new Date(2026, 10, 23, 9), now, 8500)).toEqual({
			historical: false,
			itemPriceInCents: 8500,
			totalPriceInCents: 8500,
		});
	});
	it('não gera valor a receber ao registrar data anterior', () => {
		expect(appointmentPriceForVaccination(new Date(2026, 10, 20, 11), now, 8500)).toEqual({
			historical: true,
			itemPriceInCents: 0,
			totalPriceInCents: 0,
		});
	});
	it('não aceita centavos negativos ou fracionados', () => {
		expect(() => appointmentPriceForVaccination(now, now, -100)).toThrow();
		expect(() => appointmentPriceForVaccination(now, now, 85.1)).toThrow();
	});
	it('sinaliza que registro retroativo não foi cobrado', () => {
		expect(vaccinationAppointmentNotes('V10', true)).toContain('Sem cobrança automática');
	});
});

import { describe, expect, it } from 'vitest';
import { isStaff, summarizeAppointmentItems } from './appointment-list-presentation';

const service = (name: string) => ({ service: { name } });
const product = (name: string) => ({ product: { name } });

describe('resumo visual do atendimento', () => {
	it('mostra estado vazio sem criar valor financeiro', () => {
		expect(summarizeAppointmentItems({ items: [], productItems: [] } as never)).toBe('Sem itens');
	});
	it('mostra um serviço', () => {
		expect(summarizeAppointmentItems({ items: [service('Vacina V10')], productItems: [] } as never)).toBe(
			'Vacina V10',
		);
	});
	it('resume múltiplos itens sem esconder sua quantidade', () => {
		expect(
			summarizeAppointmentItems({
				items: [service('Vacina V10'), service('Consulta')],
				productItems: [product('Vermífugo')],
			} as never),
		).toBe('Vacina V10 + 2 itens');
	});
	it('preserva restrição de ações administrativas', () => {
		expect(isStaff('doctor')).toBe(true);
		expect(isStaff('admin')).toBe(true);
		expect(isStaff('customer')).toBe(false);
	});
});

import { describe, expect, it } from 'vitest';
import { canStaffSyncAttempt, staffPaymentStatusLabels, staffReviewMessage } from './staff-online-payment';

describe('acompanhamento financeiro da equipe', () => {
	it.each(['created', 'processing', 'pending', 'approved', 'rejected', 'cancelled', 'expired'])(
		'permite consultar a situação remota de %s',
		(status) => {
			expect(canStaffSyncAttempt(status)).toBe(true);
			expect(staffPaymentStatusLabels[status]).toBeTruthy();
		},
	);
	it('impede concluir uma revisão financeira por sincronização', () => {
		expect(canStaffSyncAttempt('review')).toBe(false);
		expect(canStaffSyncAttempt('unknown')).toBe(false);
	});
	it('permite revalidar somente divergência de total pago em cartão parcelado', () => {
		const card = { reconciliationReason: 'remote_paid_amount_mismatch', method: 'credit_card', installments: 2 };
		expect(canStaffSyncAttempt('review', card)).toBe(true);
		expect(canStaffSyncAttempt('review', { ...card, installments: 1 })).toBe(false);
		expect(canStaffSyncAttempt('review', { ...card, method: 'pix' })).toBe(false);
		expect(canStaffSyncAttempt('review', { ...card, reconciliationReason: 'late_approval' })).toBe(false);
	});
	it('identifica pagamentos tardios e divergências sem expor códigos internos', () => {
		expect(staffReviewMessage('late_approval')).toMatch(/Aprovação tardia/);
		expect(staffReviewMessage('remote_amount_mismatch')).toMatch(/Valor/);
		expect(staffReviewMessage('unknown_private_detail')).not.toContain('unknown_private_detail');
		expect(staffReviewMessage(null)).toMatch(/Conferir/);
	});
});

/** Metadados estritamente necessários ao acompanhamento financeiro pela equipe. */
export type StaffOnlinePaymentAttempt = {
	id: string;
	chargeId: string;
	amountInCents: number;
	method: 'pix' | 'credit_card' | 'debit_card';
	installments: number;
	status: string;
	createdAt: string;
	updatedAt: string;
	expiresAt: string | null;
	reconciliationReason: string | null;
};

export const staffPaymentStatusLabels: Record<string, string> = {
	created: 'Criada',
	processing: 'Processando',
	pending: 'Pendente',
	approved: 'Aprovada',
	rejected: 'Recusada',
	cancelled: 'Cancelada',
	expired: 'Expirada',
	review: 'Revisão financeira',
};

const reviewLabels: Record<string, string> = {
	invalid_remote_order: 'Dados da Order incompatíveis com a conciliação',
	remote_identity_mismatch: 'Identidade ou recebedor divergente',
	remote_identifiers_mismatch: 'Identificadores da operação divergentes',
	remote_amount_mismatch: 'Valor da operação divergente',
	remote_method_mismatch: 'Método ou parcelamento divergente',
	remote_status_review: 'Estorno, contestação ou estado remoto exige revisão',
	ledger_identity_mismatch: 'Recebimento registrado diverge da tentativa',
	post_approval_conflict: 'Pagamento confirmado sofreu alteração posterior',
	post_approval_amount_mismatch: 'Valor pago mudou após a aprovação',
	approved_without_ledger: 'Aprovação sem recebimento correspondente',
	late_approval: 'Aprovação tardia após encerramento da tentativa',
	charge_not_available: 'Cobrança ou atendimento indisponível para baixa',
	payment_exceeds_balance: 'Valor aprovado supera o saldo disponível',
	invalid_ledger: 'Inconsistência no saldo financeiro',
	remote_paid_amount_mismatch: 'Valor confirmado pelo provedor divergente',
	terminal_status_conflict: 'Estados finais da operação divergentes',
	remote_status_conflict: 'Estados da Order e do pagamento divergentes',
};

export function staffReviewMessage(reason: string | null): string {
	return (reason && reviewLabels[reason]) || 'Conferir a tentativa manualmente antes de qualquer ajuste financeiro';
}

/** A revisão nunca é finalizada por uma sincronização automática. */
export function canStaffSyncAttempt(status: string): boolean {
	return status !== 'review' && status in staffPaymentStatusLabels;
}

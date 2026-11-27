import { describe, expect, it } from 'vitest';
import { planReconciliation, readReconciliationReference } from './reconciliation-policy';

const attempt = {
	id: 'c943e3cd-d2bb-4c19-a386-5a8e56899128',
	collectorId: '123',
	environment: 'test',
	amountInCents: 15000,
	method: 'pix',
	installments: 1,
	status: 'processing',
	providerOrderId: null,
	providerPaymentId: null,
};
const charge = { status: 'open', totalInCents: 15000, appointmentStatus: 'completed', isPaid: false };
const payment = {
	id: 'PAY123',
	amount: '150.00',
	paid_amount: '150.00',
	status: 'processed',
	status_detail: 'accredited',
	payment_method: { id: 'pix', type: 'bank_transfer' },
};
const order = {
	id: 'ORD123',
	external_reference: attempt.id,
	user_id: '123',
	country_code: 'BRA',
	currency: 'BRL',
	live_mode: false,
	type: 'online',
	processing_mode: 'automatic',
	total_amount: '150.00',
	total_paid_amount: '150.00',
	status: 'processed',
	status_detail: 'accredited',
	transactions: { payments: [payment] },
};
const ledger = {
	amountInCents: 15000,
	onlinePaymentAttemptId: attempt.id,
	operationKey: attempt.id,
	source: 'mercado_pago',
	method: 'pix',
};
const pending = {
	...order,
	status: 'action_required',
	status_detail: 'waiting_payment',
	total_paid_amount: '0.00',
	transactions: {
		payments: [{ ...payment, status: 'action_required', status_detail: 'waiting_payment', paid_amount: '0.00' }],
	},
};
const rejected = {
	...order,
	status: 'failed',
	status_detail: 'failed',
	total_paid_amount: '0.00',
	transactions: { payments: [{ ...payment, status: 'failed', status_detail: 'failed', paid_amount: '0.00' }] },
};

describe('referência autenticada', () => {
	it('recupera tentativa pelo UUID quando a resposta inicial foi perdida', () =>
		expect(readReconciliationReference(order, order.id)).toBe(attempt.id));
	it('ignora referência de outra aplicação', () =>
		expect(readReconciliationReference({ ...order, external_reference: 'pedido-99' }, order.id)).toBeNull());
	it('rejeita retorno de ID diferente', () => expect(() => readReconciliationReference(order, 'ORD999')).toThrow());
});

describe('política de conciliação', () => {
	it('aprova somente com confirmação integral de order e pagamento', () =>
		expect(planReconciliation(order, order.id, attempt, charge, [])).toMatchObject({
			kind: 'credit',
			status: 'approved',
			settlesCharge: true,
			providerPaymentId: 'PAY123',
		}));
	it('mantém pagamento pendente fora do ledger', () =>
		expect(planReconciliation(pending, order.id, attempt, charge, [])).toMatchObject({
			kind: 'update',
			status: 'pending',
		}));
	it('libera rejeição confirmada sem recebimento', () =>
		expect(planReconciliation(rejected, order.id, attempt, charge, [])).toMatchObject({
			kind: 'update',
			status: 'rejected',
		}));
	it('não repete recebimento aprovado', () =>
		expect(planReconciliation(order, order.id, { ...attempt, status: 'approved' }, charge, [ledger])).toEqual({
			kind: 'ignore',
		}));
	it('não rebaixa aprovação por resposta pendente atrasada', () =>
		expect(planReconciliation(pending, order.id, { ...attempt, status: 'approved' }, charge, [ledger])).toEqual({
			kind: 'ignore',
		}));
	it('preserva revisão até resolução humana', () =>
		expect(planReconciliation(order, order.id, { ...attempt, status: 'review' }, charge, [])).toEqual({
			kind: 'ignore',
		}));
	it('aprovação tardia após rejeição exige revisão', () =>
		expect(planReconciliation(order, order.id, { ...attempt, status: 'rejected' }, charge, [])).toMatchObject({
			kind: 'review',
			reason: 'late_approval',
		}));
	it('não aceita aprovado sem ledger', () =>
		expect(planReconciliation(order, order.id, { ...attempt, status: 'approved' }, charge, [])).toMatchObject({
			kind: 'review',
		}));
	it('sinaliza estorno sem remover recebimento', () =>
		expect(
			planReconciliation({ ...order, status: 'refunded' }, order.id, { ...attempt, status: 'approved' }, charge, [
				ledger,
			]),
		).toMatchObject({ kind: 'review' }));
	it.each([
		{ user_id: '999' },
		{ live_mode: true },
		{ total_amount: '149.00' },
		{ total_paid_amount: '149.00' },
		{ total_paid_amount: undefined },
		{ country_code: 'ARG' },
		{ currency: 'USD' },
		{ transactions: { payments: [payment, payment] } },
		{ transactions: { payments: [{ ...payment, paid_amount: '0.00' }] } },
		{ transactions: { payments: [{ ...payment, payment_method: { id: 'visa', type: 'credit_card' } }] } },
		{ transactions: { payments: [payment], refunds: [{}] } },
		{ transactions: { payments: [{ ...payment, status: 'action_required', status_detail: 'waiting_payment' }] } },
	])('sinaliza divergência remota %j', (patch) =>
		expect(planReconciliation({ ...order, ...patch }, order.id, attempt, charge, [])).toMatchObject({
			kind: 'review',
		}),
	);
	it('não substitui identificador já persistido', () =>
		expect(planReconciliation(order, order.id, { ...attempt, providerOrderId: 'OTHER' }, charge, [])).toMatchObject(
			{ kind: 'review' },
		));
	it('não baixa cobrança cancelada', () =>
		expect(planReconciliation(order, order.id, attempt, { ...charge, status: 'void' }, [])).toMatchObject({
			kind: 'review',
		}));
	it('não excede o saldo após recebimento manual', () =>
		expect(
			planReconciliation(order, order.id, attempt, charge, [
				{ ...ledger, amountInCents: 100, onlinePaymentAttemptId: null, source: 'manual' },
			]),
		).toMatchObject({ kind: 'review', reason: 'payment_exceeds_balance' }));
	it('aceita saldo remanescente após recebimento parcial', () =>
		expect(
			planReconciliation(order, order.id, attempt, { ...charge, totalInCents: 20000 }, [
				{ ...ledger, amountInCents: 5000, onlinePaymentAttemptId: null, source: 'manual' },
			]),
		).toMatchObject({ kind: 'credit', settlesCharge: true }));
});

describe('recusas definitivas de cartão na API Orders', () => {
	const cardAttempt = { ...attempt, method: 'credit_card' };
	const cardPayment = {
		...payment,
		status: 'failed',
		status_detail: 'rejected_by_issuer',
		paid_amount: '0.00',
		payment_method: { id: 'master', type: 'credit_card', installments: 1 },
	};
	const cardOrder = { ...rejected, transactions: { payments: [cardPayment] } };
	it.each([
		'rejected_by_issuer',
		'insufficient_amount',
		'bad_filled_card_data',
		'card_disabled',
		'invalid_installments',
		'required_call_for_authorize',
	])('libera recusa confirmada %s sem crédito', (detail) => {
		const raw = { ...cardOrder, transactions: { payments: [{ ...cardPayment, status_detail: detail }] } };
		expect(planReconciliation(raw, raw.id, cardAttempt, charge, [])).toMatchObject({
			kind: 'update',
			status: 'rejected',
			settlesCharge: false,
			providerOrderId: 'ORD123',
			providerPaymentId: 'PAY123',
		});
	});
	it.each(['processing_error', 'unknown_failure', 'high_risk'])('mantém revisão para %s', (detail) => {
		const raw = { ...cardOrder, transactions: { payments: [{ ...cardPayment, status_detail: detail }] } };
		expect(planReconciliation(raw, raw.id, cardAttempt, charge, [])).toMatchObject({ kind: 'review' });
	});
	it('não libera quando a Order não é terminal', () => {
		const raw = { ...cardOrder, status: 'processing', status_detail: 'in_process' };
		expect(planReconciliation(raw, raw.id, cardAttempt, charge, [])).toMatchObject({ kind: 'review' });
	});
	it('não libera quando houve valor pago', () => {
		const raw = { ...cardOrder, total_paid_amount: '150.00' };
		expect(planReconciliation(raw, raw.id, cardAttempt, charge, [])).toMatchObject({ kind: 'review' });
	});
	it('não desfaz revisão anterior automaticamente', () => {
		expect(planReconciliation(cardOrder, cardOrder.id, { ...cardAttempt, status: 'review' }, charge, [])).toEqual({
			kind: 'ignore',
		});
	});
	it('aceita ausência de paid_amount se o total pago da Order for zero', () => {
		const raw = { ...cardOrder, transactions: { payments: [{ ...cardPayment, paid_amount: undefined }] } };
		expect(planReconciliation(raw, raw.id, cardAttempt, charge, [])).toMatchObject({
			kind: 'update',
			status: 'rejected',
		});
	});
});

describe('aprovação de cartão parcelado com acréscimo', () => {
	const card = { ...attempt, method: 'credit_card', installments: 2, amountInCents: 20000 };
	const bill = { ...charge, totalInCents: 20000 };
	const receipt = { ...ledger, method: 'credit_card', amountInCents: 20000 };
	const cardPayment = {
		...payment,
		amount: '200.00',
		paid_amount: '219.28',
		payment_method: { id: 'master', type: 'credit_card', installments: 2 },
	};
	const raw = {
		...order,
		total_amount: '200.00',
		total_paid_amount: '219.28',
		transactions: { payments: [cardPayment] },
	};
	it('credita o principal com acréscimo confirmado', () => {
		expect(planReconciliation(raw, raw.id, card, bill, [])).toMatchObject({ kind: 'credit', settlesCharge: true });
	});
	it('ignora webhook repetido após crédito do principal', () => {
		expect(planReconciliation(raw, raw.id, { ...card, status: 'approved' }, bill, [receipt])).toEqual({
			kind: 'ignore',
		});
	});
	it.each(['200.00', '199.99', '0.00', '219.2', '2e2', '-219.28', '999999999.00', undefined])(
		'valida total pago %s',
		(paid) => {
			const changed = {
				...raw,
				total_paid_amount: paid,
				transactions: { payments: [{ ...cardPayment, paid_amount: paid }] },
			};
			expect(planReconciliation(changed, raw.id, card, bill, [])).toMatchObject({
				kind: paid === '200.00' ? 'credit' : 'review',
			});
		},
	);
	it('não aceita divergência superior a um centavo entre os totais efetivamente pagos', () => {
		expect(planReconciliation({ ...raw, total_paid_amount: '219.30' }, raw.id, card, bill, [])).toMatchObject({
			kind: 'review',
		});
	});
	it('não flexibiliza cartão à vista', () => {
		const single = {
			...raw,
			transactions: {
				payments: [{ ...cardPayment, payment_method: { ...cardPayment.payment_method, installments: 1 } }],
			},
		};
		expect(planReconciliation(single, raw.id, { ...card, installments: 1 }, bill, [])).toMatchObject({
			kind: 'review',
		});
	});
	it('não flexibiliza Pix', () => {
		const pix = {
			...raw,
			transactions: { payments: [{ ...cardPayment, payment_method: payment.payment_method }] },
		};
		expect(planReconciliation(pix, raw.id, { ...card, method: 'pix', installments: 1 }, bill, [])).toMatchObject({
			kind: 'review',
		});
	});
	it('mantém revisão quando o principal diverge', () => {
		expect(planReconciliation({ ...raw, total_amount: '219.28' }, raw.id, card, bill, [])).toMatchObject({
			kind: 'review',
			reason: 'remote_amount_mismatch',
		});
	});
	it('mantém revisão quando as parcelas divergem', () => {
		expect(planReconciliation(raw, raw.id, { ...card, installments: 3 }, bill, [])).toMatchObject({
			kind: 'review',
			reason: 'remote_method_mismatch',
		});
	});
	it('não credita acima do saldo', () => {
		expect(planReconciliation(raw, raw.id, card, { ...bill, totalInCents: 19900 }, [])).toMatchObject({
			kind: 'review',
			reason: 'payment_exceeds_balance',
		});
	});
	it('não resolve revisão existente automaticamente', () => {
		expect(planReconciliation(raw, raw.id, { ...card, status: 'review' }, bill, [])).toEqual({ kind: 'ignore' });
	});
	it('não ignora divergência após crédito', () => {
		expect(
			planReconciliation({ ...raw, total_paid_amount: '219.29' }, raw.id, { ...card, status: 'approved' }, bill, [
				receipt,
			]),
		).toMatchObject({ kind: 'review', reason: 'post_approval_amount_mismatch' });
	});
});

describe('total confirmado pelo comprador', () => {
	it('persiste o total confirmado sem alterar o principal', () => {
		expect(planReconciliation(order, order.id, attempt, charge, [])).toMatchObject({
			kind: 'credit',
			providerPaidAmountInCents: attempt.amountInCents,
		});
	});
	it('complementa tentativa histórica somente com aprovação e ledger compatíveis', () => {
		expect(
			planReconciliation(
				order,
				order.id,
				{ ...attempt, status: 'approved', providerPaidAmountInCents: null },
				charge,
				[ledger],
			),
		).toEqual({ kind: 'enrich', providerPaidAmountInCents: attempt.amountInCents });
	});
	it('não sobrescreve valor confirmado divergente', () => {
		expect(
			planReconciliation(
				order,
				order.id,
				{ ...attempt, status: 'approved', providerPaidAmountInCents: attempt.amountInCents + 1 },
				charge,
				[ledger],
			),
		).toEqual({ kind: 'review', reason: 'post_approval_amount_mismatch' });
	});
	it('ignora duplicata com total já confirmado', () => {
		expect(
			planReconciliation(
				order,
				order.id,
				{ ...attempt, status: 'approved', providerPaidAmountInCents: attempt.amountInCents },
				charge,
				[ledger],
			),
		).toEqual({ kind: 'ignore' });
	});
});

describe('arredondamento de cartão parcial e recuperação explícita', () => {
	const card = { ...attempt, method: 'credit_card', installments: 2, amountInCents: 8000 };
	const bill = { ...charge, totalInCents: 20000 };
	const receipt = { ...ledger, method: 'credit_card', amountInCents: 8000 };
	const reviewed = {
		...card,
		status: 'review',
		reconciliationReason: 'remote_paid_amount_mismatch',
		providerOrderId: order.id,
		providerPaymentId: payment.id,
		providerPaidAmountInCents: null,
	};
	const approved = { ...reviewed, status: 'approved' };
	const remote = (orderPaid = '87.71', paymentPaid = '87.72') => ({
		...order,
		total_amount: '80.00',
		total_paid_amount: orderPaid,
		transactions: {
			payments: [
				{
					...payment,
					amount: '80.00',
					paid_amount: paymentPaid,
					payment_method: { id: 'master', type: 'credit_card', installments: 2 },
				},
			],
		},
	});
	it.each([
		['87.71', '87.72'],
		['87.72', '87.71'],
	])('credita principal parcial sem presumir total %s/%s', (a, b) => {
		expect(planReconciliation(remote(a, b), order.id, card, bill, [])).toMatchObject({
			kind: 'credit',
			status: 'approved',
			settlesCharge: false,
			providerPaidAmountInCents: null,
		});
	});
	it.each([
		['87.71', '87.73'],
		['79.99', '80.00'],
		['80.00', '79.99'],
		['87.7', '87.71'],
		['21474836.48', '21474836.47'],
	])('recusa totais inválidos %s/%s', (a, b) => {
		expect(planReconciliation(remote(a, b), order.id, card, bill, [])).toEqual({
			kind: 'review',
			reason: 'remote_paid_amount_mismatch',
		});
	});
	it('não tolera principal divergente nem estorno informado', () => {
		expect(planReconciliation({ ...remote(), total_amount: '80.01' }, order.id, card, bill, [])).toMatchObject({
			kind: 'review',
			reason: 'remote_amount_mismatch',
		});
		expect(
			planReconciliation({ ...remote(), total_refunded_amount: '0.01' }, order.id, card, bill, []),
		).toMatchObject({
			kind: 'review',
			reason: 'remote_status_review',
		});
	});
	it('não tolera um centavo para Pix ou cartão à vista', () => {
		const pix = { ...order, total_paid_amount: '150.01' };
		expect(planReconciliation(pix, order.id, attempt, charge, [])).toMatchObject({ kind: 'review' });
		const one = {
			...remote(),
			transactions: {
				payments: [
					{
						...remote().transactions.payments[0]!,
						payment_method: { id: 'master', type: 'credit_card', installments: 1 },
					},
				],
			},
		};
		expect(planReconciliation(one, order.id, { ...card, installments: 1 }, bill, [])).toMatchObject({
			kind: 'review',
		});
	});
	it('ignora duplicata sem total confirmado e complementa somente após concordância', () => {
		expect(planReconciliation(remote(), order.id, approved, bill, [receipt])).toEqual({ kind: 'ignore' });
		expect(planReconciliation(remote('87.72', '87.72'), order.id, approved, bill, [receipt])).toEqual({
			kind: 'enrich',
			providerPaidAmountInCents: 8772,
		});
	});
	it('não sobrescreve total já confirmado quando os totais divergem posteriormente', () => {
		expect(
			planReconciliation(remote(), order.id, { ...approved, providerPaidAmountInCents: 8771 }, bill, [receipt]),
		).toEqual({
			kind: 'review',
			reason: 'post_approval_amount_mismatch',
		});
	});
	it('recupera somente por solicitação explícita da equipe', () => {
		expect(planReconciliation(remote(), order.id, reviewed, bill, [])).toEqual({ kind: 'ignore' });
		expect(planReconciliation(remote(), order.id, reviewed, bill, [], true)).toMatchObject({
			kind: 'credit',
			providerPaidAmountInCents: null,
			settlesCharge: false,
		});
	});
	it.each([
		{ reconciliationReason: 'late_approval' },
		{ providerOrderId: null },
		{ providerPaymentId: 'OTHER' },
		{ providerPaidAmountInCents: 8772 },
	])('não recupera revisão fora das condições %j', (patch) => {
		expect(planReconciliation(remote(), order.id, { ...reviewed, ...patch }, bill, [], true)).toEqual({
			kind: 'ignore',
		});
	});
	it('preserva revisão se já há recebimento, saldo insuficiente, identidade divergente ou resposta não aprovada', () => {
		expect(planReconciliation(remote(), order.id, reviewed, bill, [receipt], true)).toEqual({ kind: 'ignore' });
		expect(planReconciliation(remote(), order.id, reviewed, { ...bill, totalInCents: 7999 }, [], true)).toEqual({
			kind: 'ignore',
		});
		expect(planReconciliation({ ...remote(), user_id: '999' }, order.id, reviewed, bill, [], true)).toEqual({
			kind: 'ignore',
		});
		expect(
			planReconciliation(
				{ ...remote(), status: 'failed', status_detail: 'failed' },
				order.id,
				reviewed,
				bill,
				[],
				true,
			),
		).toEqual({ kind: 'ignore' });
	});
});

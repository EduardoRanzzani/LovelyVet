import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reconcileMercadoPagoOrder } from './reconciliation.service';
import { PAYMENT_TEST_PET_ID } from '@/lib/finance/online-payment-scope';

const mocks = vi.hoisted(() => ({
	transaction: vi.fn(),
	get: vi.fn(),
	where: vi.fn(),
	execute: vi.fn(),
	set: vi.fn(),
	values: vi.fn(),
	update: vi.fn(),
}));
vi.mock('@/db', () => ({ db: { transaction: mocks.transaction } }));
vi.mock('@/lib/integrations/mercado-pago-config', () => ({
	getMercadoPagoConfig: () => ({ environment: 'test', collectorId: '123' }),
}));
vi.mock('@/lib/integrations/mercado-pago', async (importOriginal) => ({
	...(await importOriginal<typeof import('@/lib/integrations/mercado-pago')>()),
	getMercadoPagoOrderClient: () => ({ get: mocks.get }),
}));
const id = 'c943e3cd-d2bb-4c19-a386-5a8e56899128';
const attempt = {
	id,
	chargeId: 'charge',
	collectorId: '123',
	environment: 'test',
	amountInCents: 15000,
	method: 'pix',
	installments: 1,
	status: 'processing',
	providerOrderId: null,
	providerPaymentId: null,
};
const row = {
	attempt,
	charge: { id: 'charge', status: 'open', totalInCents: 15000 },
	appointment: { id: 'appointment', petId: PAYMENT_TEST_PET_ID, status: 'completed', isPaid: false },
};
const order = {
	id: 'ORD123',
	external_reference: id,
	user_id: '123',
	country_code: 'BRA',
	type: 'online',
	processing_mode: 'automatic',
	total_amount: '150.00',
	total_paid_amount: '150.00',
	status: 'processed',
	status_detail: 'accredited',
	transactions: {
		payments: [
			{
				id: 'PAY123',
				amount: '150.00',
				paid_amount: '150.00',
				status: 'processed',
				status_detail: 'accredited',
				payment_method: { id: 'pix', type: 'bank_transfer' },
			},
		],
	},
};

beforeEach(() => {
	mocks.where.mockReset();
	mocks.get.mockReset().mockResolvedValue(order);
	mocks.values.mockReset().mockResolvedValue(undefined);
	mocks.set.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
	mocks.update.mockReturnValue({ set: mocks.set });
	const chain = { from: () => chain, innerJoin: () => chain, where: mocks.where };
	const tx = {
		select: () => chain,
		execute: mocks.execute,
		update: mocks.update,
		insert: () => ({ values: mocks.values }),
	};
	mocks.transaction.mockImplementation((callback: (tx: unknown) => Promise<void>) => callback(tx));
	mocks.where
		.mockResolvedValueOnce([{ appointmentId: 'appointment' }])
		.mockResolvedValueOnce([row])
		.mockResolvedValueOnce([]);
});

describe('persistência da conciliação', () => {
	it('não concilia outra tentativa a partir da sincronização autenticada', async () => {
		await expect(reconcileMercadoPagoOrder('ORD123', 'b943e3cd-d2bb-4c19-a386-5a8e56899128')).rejects.toThrow(
			'Referência remota incompatível',
		);
		expect(mocks.execute).not.toHaveBeenCalled();
		expect(mocks.values).not.toHaveBeenCalled();
	});
	it('não retorna Pix quando a cobrança foi cancelada', async () => {
		mocks.where
			.mockReset()
			.mockResolvedValueOnce([{ appointmentId: 'appointment' }])
			.mockResolvedValueOnce([{ ...row, charge: { ...row.charge, status: 'cancelled' } }])
			.mockResolvedValueOnce([]);
		const png = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.alloc(16)]).toString('base64');
		mocks.get.mockResolvedValue({
			...order,
			status: 'action_required',
			status_detail: 'waiting_transfer',
			total_paid_amount: '0.00',
			transactions: {
				payments: [
					{
						...order.transactions.payments[0],
						status: 'action_required',
						status_detail: 'waiting_transfer',
						paid_amount: '0.00',
						payment_method: {
							id: 'pix',
							type: 'bank_transfer',
							qr_code: '000201TESTE',
							qr_code_base64: png,
						},
					},
				],
			},
		});
		await expect(reconcileMercadoPagoOrder('ORD123', id)).resolves.toBeUndefined();
		expect(mocks.values).not.toHaveBeenCalled();
	});
	it('persiste validade explícita e retorna código mesmo sem PNG em Pix pendente', async () => {
		const expiration = '2026-11-27T16:00:00Z';
		mocks.get.mockResolvedValue({
			...order,
			status: 'action_required',
			status_detail: 'waiting_transfer',
			total_paid_amount: undefined,
			transactions: {
				payments: [
					{
						...order.transactions.payments[0],
						status: 'action_required',
						status_detail: 'waiting_transfer',
						paid_amount: undefined,
						date_of_expiration: expiration,
						payment_method: {
							id: 'pix',
							type: 'bank_transfer',
							qr_code: '000201TESTE',
							qr_code_base64: '',
						},
					},
				],
			},
		});
		await expect(reconcileMercadoPagoOrder('ORD123', id)).resolves.toEqual({
			orderId: 'ORD123',
			paymentId: 'PAY123',
			pix: { code: '000201TESTE', pngBase64: null },
		});
		expect(mocks.set).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'pending', expiresAt: new Date(expiration) }),
		);
		expect(mocks.values).not.toHaveBeenCalled();
	});
	it('consulta API antes da transação, bloqueia atendimento e tentativa, insere ledger e quita', async () => {
		await reconcileMercadoPagoOrder('ORD123');
		expect(mocks.get.mock.invocationCallOrder[0]).toBeLessThan(mocks.transaction.mock.invocationCallOrder[0]!);
		expect(mocks.execute).toHaveBeenCalledTimes(2);
		expect(mocks.set).toHaveBeenCalledWith(
			expect.objectContaining({
				status: 'approved',
				providerOrderId: 'ORD123',
				approvedAt: expect.any(Date),
				providerPaidAmountInCents: 15000,
			}),
		);
		expect(mocks.values).toHaveBeenCalledWith(
			expect.objectContaining({
				operationKey: id,
				onlinePaymentAttemptId: id,
				chargeId: 'charge',
				amountInCents: 15000,
				source: 'mercado_pago',
				receivedBy: null,
			}),
		);
		expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ isPaid: true }));
	});
	it('não grava tentativa desconhecida ou fora do escopo da conta', async () => {
		mocks.where.mockReset().mockResolvedValueOnce([]);
		await reconcileMercadoPagoOrder('ORD123');
		expect(mocks.execute).not.toHaveBeenCalled();
		expect(mocks.values).not.toHaveBeenCalled();
	});
	it('rejeita pet real em teste', async () => {
		mocks.where
			.mockReset()
			.mockResolvedValueOnce([{ appointmentId: 'appointment' }])
			.mockResolvedValueOnce([{ ...row, appointment: { ...row.appointment, petId: 'other' } }]);
		await expect(reconcileMercadoPagoOrder('ORD123')).rejects.toThrow('homologação');
		expect(mocks.values).not.toHaveBeenCalled();
	});
	it('registra revisão sem inserir recebimento quando recebedor diverge', async () => {
		mocks.get.mockResolvedValue({ ...order, user_id: '999' });
		await reconcileMercadoPagoOrder('ORD123');
		expect(mocks.set).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'review', reconciliationReason: 'remote_identity_mismatch' }),
		);
		expect(mocks.values).not.toHaveBeenCalled();
	});
	it('propaga falha do insert para rollback do driver e retry do webhook', async () => {
		mocks.values.mockRejectedValueOnce(new Error('constraint'));
		await expect(reconcileMercadoPagoOrder('ORD123')).rejects.toThrow('constraint');
		expect(mocks.set).not.toHaveBeenCalledWith(expect.objectContaining({ isPaid: true }));
	});
});

it('registra somente o principal de cartão parcelado aprovado', async () => {
	mocks.where
		.mockReset()
		.mockResolvedValueOnce([{ appointmentId: 'appointment' }])
		.mockResolvedValueOnce([
			{
				...row,
				attempt: { ...attempt, method: 'credit_card', installments: 2, amountInCents: 20000 },
				charge: { ...row.charge, totalInCents: 20000 },
			},
		])
		.mockResolvedValueOnce([]);
	mocks.get.mockResolvedValue({
		...order,
		total_amount: '200.00',
		total_paid_amount: '219.28',
		transactions: {
			payments: [
				{
					...order.transactions.payments[0],
					amount: '200.00',
					paid_amount: '219.28',
					payment_method: { id: 'master', type: 'credit_card', installments: 2 },
				},
			],
		},
	});
	await reconcileMercadoPagoOrder('ORD123');
	expect(mocks.values).toHaveBeenCalledTimes(1);
	expect(mocks.values).toHaveBeenCalledWith(
		expect.objectContaining({ amountInCents: 20000, method: 'credit_card', onlinePaymentAttemptId: id }),
	);
	expect(mocks.set).toHaveBeenCalledWith(
		expect.objectContaining({ status: 'approved', providerPaidAmountInCents: 21928 }),
	);
	expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ isPaid: true }));
});

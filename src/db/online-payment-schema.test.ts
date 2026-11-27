import { describe, expect, it } from 'vitest';
import { getTableConfig, PgDialect } from 'drizzle-orm/pg-core';
import { chargePaymentsTable, onlinePaymentAttemptsTable } from './schema';

const attempts = getTableConfig(onlinePaymentAttemptsTable);
const payments = getTableConfig(chargePaymentsTable);
const dialect = new PgDialect();

describe('modelagem financeira online', () => {
	it('preserva a origem manual como padrão e autoria opcional na coluna', () => {
		expect(chargePaymentsTable.source.default).toBe('manual');
		expect(chargePaymentsTable.source.notNull).toBe(true);
		expect(chargePaymentsTable.receivedBy.notNull).toBe(false);
	});
	it('restringe a origem e exige autor manual ou tentativa online', () => {
		const constraint = payments.checks.find((item) => item.name === 'charge_payment_source_valid');
		if (!constraint) throw new Error('Constraint ausente');
		const { sql } = dialect.sqlToQuery(constraint.value);
		expect(sql).toContain("= 'manual'");
		expect(sql).toContain("= 'mercado_pago'");
		expect(sql).toContain('"received_by" IS NOT NULL');
		expect(sql).toContain('"received_by" IS NULL');
		expect(sql).toContain('"online_payment_attempt_id" IS NOT NULL');
	});
	it('impede vincular o recebimento a outra cobrança, valor ou método', () => {
		const fk = payments.foreignKeys.find((item) => item.getName() === 'charge_payment_online_attempt_identity_fk');
		if (!fk) throw new Error('FK ausente');
		const ref = fk.reference();
		expect(ref.columns.map((column) => column.name)).toEqual([
			'online_payment_attempt_id',
			'charge_id',
			'amount_in_cents',
			'method',
		]);
		expect(ref.foreignColumns.map((column) => column.name)).toEqual([
			'id',
			'charge_id',
			'amount_in_cents',
			'method',
		]);
	});
	it('permite vários recebimentos manuais mas apenas um por tentativa online', () => {
		const idx = payments.indexes.find((item) => item.config.name === 'charge_payments_online_attempt_unique');
		expect(idx?.config.unique).toBe(true);
		expect(chargePaymentsTable.onlinePaymentAttemptId.notNull).toBe(false);
	});
	it('mantém IDs externos únicos por ambiente', () => {
		for (const name of ['online_attempt_provider_order_unique', 'online_attempt_provider_payment_unique']) {
			expect(attempts.indexes.find((item) => item.config.name === name)?.config.unique).toBe(true);
		}
	});
	it('reserva apenas uma tentativa ativa por cobrança sem impedir a persistência de exceções tardias', () => {
		const idx = attempts.indexes.find((item) => item.config.name === 'online_attempt_one_active_per_charge');
		expect(idx?.config.unique).toBe(true);
		if (!idx?.config.where) throw new Error('Índice parcial ausente');
		const { sql } = dialect.sqlToQuery(idx.config.where);
		expect(sql).toContain("'created','processing','pending'");
	});
	it('exige os IDs externos e data quando a tentativa é aprovada', () => {
		const constraint = attempts.checks.find((item) => item.name === 'online_attempt_approval_valid');
		if (!constraint) throw new Error('Constraint ausente');
		const { sql } = dialect.sqlToQuery(constraint.value);
		expect(sql).toContain("<> 'approved'");
		for (const field of ['provider_order_id', 'provider_payment_id', 'approved_at']) {
			expect(sql).toContain(`"${field}" IS NOT NULL`);
		}
	});
});

it('permite total remoto desconhecido e protege principal e acréscimos', () => {
	expect(onlinePaymentAttemptsTable.providerPaidAmountInCents.notNull).toBe(false);
	const constraint = attempts.checks.find((item) => item.name === 'online_attempt_provider_paid_valid');
	if (!constraint) throw new Error('Constraint ausente');
	const { sql } = dialect.sqlToQuery(constraint.value);
	expect(sql).toContain('"provider_paid_amount_in_cents" IS NULL');
	expect(sql).toContain('>=');
	expect(sql).toContain("'credit_card'");
});

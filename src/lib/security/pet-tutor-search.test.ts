import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it, vi } from 'vitest';
import type { AuthContext } from './auth-context';
import { buildPetTutorSearchCondition } from './pet-tutor-search';

vi.mock('@/db', async () => {
	const { QueryBuilder } = await import('drizzle-orm/pg-core');
	return { db: new QueryBuilder() };
});

const customer: AuthContext = {
	role: 'customer',
	customerId: '33333333-3333-4333-8333-333333333333',
	doctorId: null,
	userId: 'user',
	clerkUserId: 'clerk',
};
const dialect = new PgDialect();

describe('busca de pets pelo tutor', () => {
	it('restringe a subconsulta ao vínculo do próprio tutor', () => {
		const query = dialect.sqlToQuery(buildPetTutorSearchCondition(customer, '%nome%'));
		expect(query.sql).toContain('"pet_tutors"."customer_id" =');
		expect(query.params).toEqual(['%nome%', customer.customerId]);
	});

	it.each(['admin', 'doctor'] as const)('preserva a busca da equipe para %s', (role) => {
		const query = dialect.sqlToQuery(
			buildPetTutorSearchCondition({ ...customer, role, customerId: null }, '%nome%'),
		);
		expect(query.params).toEqual(['%nome%']);
	});

	it('nega tutor sem cadastro', () => {
		expect(() => buildPetTutorSearchCondition({ ...customer, customerId: null }, '%nome%')).toThrow(
			'Perfil de cliente não encontrado',
		);
	});
});

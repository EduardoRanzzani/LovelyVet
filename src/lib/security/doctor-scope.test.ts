import { describe, expect, it } from 'vitest';

import type { AuthContext } from './auth-context';
import { getDoctorScopeId, resolveRequestedDoctorId } from './doctor-scope';

const context = (
	role: AuthContext['role'],
	overrides: Partial<AuthContext> = {},
): AuthContext => ({
	clerkUserId: 'clerk-user-id',
	userId: 'user-id',
	role,
	customerId: role === 'customer' ? 'customer-id' : null,
	doctorId: role === 'doctor' ? 'doctor-a' : null,
	...overrides,
});

describe('resolveRequestedDoctorId', () => {
	it('forces a doctor to use their own doctor id', () => {
		expect(resolveRequestedDoctorId(context('doctor'), 'doctor-a')).toBe(
			'doctor-a',
		);
	});

	it('uses the authenticated doctor when no doctor id is informed', () => {
		expect(resolveRequestedDoctorId(context('doctor'))).toBe('doctor-a');
	});

	it('rejects another doctor id for an authenticated doctor', () => {
		expect(() =>
			resolveRequestedDoctorId(context('doctor'), 'doctor-b'),
		).toThrow('Você não possui permissão para utilizar este veterinário.');
	});

	it('rejects a doctor profile without doctor id', () => {
		expect(() =>
			resolveRequestedDoctorId(
				context('doctor', {
					doctorId: null,
				}),
				'doctor-a',
			),
		).toThrow('Perfil de veterinário não encontrado');
	});

	it('allows admin to select a doctor', () => {
		expect(resolveRequestedDoctorId(context('admin'), 'doctor-b')).toBe(
			'doctor-b',
		);
	});

	it('allows customer to select a doctor', () => {
		expect(resolveRequestedDoctorId(context('customer'), 'doctor-b')).toBe(
			'doctor-b',
		);
	});

	it('requires a doctor id for admin', () => {
		expect(() => resolveRequestedDoctorId(context('admin'))).toThrow(
			'Veterinário não informado',
		);
	});

	it('requires a doctor id for customer', () => {
		expect(() => resolveRequestedDoctorId(context('customer'))).toThrow(
			'Veterinário não informado',
		);
	});
});

describe('getDoctorScopeId', () => {
	it('returns the authenticated doctor id for doctor users', () => {
		expect(getDoctorScopeId(context('doctor'))).toBe('doctor-a');
	});

	it('returns null for admin users', () => {
		expect(getDoctorScopeId(context('admin'))).toBeNull();
	});

	it('returns null for customer users', () => {
		expect(getDoctorScopeId(context('customer'))).toBeNull();
	});

	it('rejects a doctor profile without doctor id', () => {
		expect(() =>
			getDoctorScopeId(
				context('doctor', {
					doctorId: null,
				}),
			),
		).toThrow('Perfil de veterinário não encontrado');
	});
});

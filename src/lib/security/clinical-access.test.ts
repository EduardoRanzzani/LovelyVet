import { describe, expect, it } from 'vitest';

import type { AuthContext } from '@/lib/security/auth-context';
import { resolveClinicalDoctorId } from '@/lib/security/clinical-access';

const context = (
	role: AuthContext['role'],
	doctorId: string | null = null,
): AuthContext => ({
	clerkUserId: 'clerk-user-id',
	userId: 'local-user-id',
	role,
	customerId: role === 'customer' ? 'customer-id' : null,
	doctorId,
});

describe('resolveClinicalDoctorId', () => {
	it('forces a doctor to use their own local doctor id', () => {
		expect(
			resolveClinicalDoctorId(
				context('doctor', 'authenticated-doctor-id'),
				'requested-doctor-id',
			),
		).toBe('authenticated-doctor-id');
	});

	it('allows an admin to select the responsible doctor', () => {
		expect(
			resolveClinicalDoctorId(context('admin'), 'requested-doctor-id'),
		).toBe('requested-doctor-id');
	});

	it('rejects customers', () => {
		expect(() =>
			resolveClinicalDoctorId(context('customer'), 'requested-doctor-id'),
		).toThrow('Usuário não autorizado');
	});

	it('rejects a doctor without a local doctor profile', () => {
		expect(() => resolveClinicalDoctorId(context('doctor'))).toThrow(
			'Perfil de veterinário não encontrado',
		);
	});

	it('requires an admin to select a doctor', () => {
		expect(() => resolveClinicalDoctorId(context('admin'))).toThrow(
			'Veterinário não informado',
		);
	});
});

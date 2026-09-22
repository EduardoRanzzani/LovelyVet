import { REGINA_DOCTOR_ID } from '@/api/config/consts';
import type { AuthContext } from './auth-context';

export function canSignWithReginaCertificate(context: AuthContext): boolean {
	if (context.role === 'admin') {
		return true;
	}

	return context.role === 'doctor' && context.doctorId === REGINA_DOCTOR_ID;
}

export function assertCanSignWithReginaCertificate(context: AuthContext): void {
	if (!canSignWithReginaCertificate(context)) {
		throw new Error(
			'Usuário não autorizado a utilizar o certificado digital desta receita.',
		);
	}
}

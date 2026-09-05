import type { AuthContext } from './auth-context';
import { requireStaff } from './authorization';

export const resolveClinicalDoctorId = (
	context: AuthContext,
	requestedDoctorId?: string | null,
): string => {
	requireStaff(context);

	if (context.role === 'doctor') {
		if (!context.doctorId) {
			throw new Error('Perfil de veterinário não encontrado');
		}
		return context.doctorId;
	}

	if (!requestedDoctorId) {
		throw new Error('Veterinário não informado');
	}
	return requestedDoctorId;
};

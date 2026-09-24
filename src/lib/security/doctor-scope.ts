import type { AuthContext } from './auth-context';

export const resolveRequestedDoctorId = (
	context: AuthContext,
	requestedDoctorId?: string | null,
): string => {
	if (context.role === 'doctor') {
		if (!context.doctorId) {
			throw new Error('Perfil de veterinário não encontrado');
		}

		if (requestedDoctorId && requestedDoctorId !== context.doctorId) {
			throw new Error(
				'Você não possui permissão para utilizar este veterinário.',
			);
		}

		return context.doctorId;
	}

	if (!requestedDoctorId) {
		throw new Error('Veterinário não informado');
	}

	return requestedDoctorId;
};

export const getDoctorScopeId = (context: AuthContext): string | null => {
	if (context.role !== 'doctor') {
		return null;
	}

	if (!context.doctorId) {
		throw new Error('Perfil de veterinário não encontrado');
	}

	return context.doctorId;
};

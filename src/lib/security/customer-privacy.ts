import type { AuthContext } from './auth-context';

type UserWithEmail = {
	email: string;
};

type DoctorWithPrivateData = {
	phone: string;
	cpf: string;
	user: UserWithEmail;
};

type TutorWithPrivateData = {
	phone: string;
	cpf: string;
	postalCode: string;
	address: string;
	addressNumber: string;
	neighborhood: string;
	city: string;
	state: string;
	user: UserWithEmail;
};

export const sanitizeUserForCustomer = <T extends UserWithEmail>(user: T): T => ({
	...user,
	email: '',
});

export const sanitizeDoctorForCustomer = <T extends DoctorWithPrivateData>(
	doctor: T,
): T => ({
	...doctor,
	phone: '',
	cpf: '',
	user: sanitizeUserForCustomer(doctor.user),
});

export const sanitizeTutorForCustomer = <T extends TutorWithPrivateData>(
	tutor: T,
): T => ({
	...tutor,
	phone: '',
	cpf: '',
	postalCode: '',
	address: '',
	addressNumber: '',
	neighborhood: '',
	city: '',
	state: '',
	user: sanitizeUserForCustomer(tutor.user),
});

/**
 * Documentos clínicos/receitas podem ser emitidos nominalmente para um tutor.
 * Em pets compartilhados, acesso ao pet não implica acesso aos documentos
 * nominais emitidos para outro tutor.
 */
export const canAccessTutorScopedData = (
	context: AuthContext,
	tutorId: string | null | undefined,
): boolean => {
	if (context.role !== 'customer') {
		return true;
	}

	if (!context.customerId) {
		return false;
	}

	// Dados legados sem tutor associado continuam acessíveis pelo vínculo ao pet.
	if (!tutorId) {
		return true;
	}

	return tutorId === context.customerId;
};

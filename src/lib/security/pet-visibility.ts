import type { PetsWithRelations } from '@/api/schema/pets.schema';
import type { AuthContext } from './auth-context';
import {
	canAccessTutorScopedData,
	sanitizeDoctorForCustomer,
	sanitizeTutorForCustomer,
	sanitizeUserForCustomer,
} from './customer-privacy';

/**
 * Remove dados internos/PII que não devem atravessar a fronteira servidor ->
 * cliente quando o visualizador é um tutor.
 *
 * A autorização para enxergar o pet é responsabilidade de pet-access.ts.
 * Este helper trata exclusivamente a forma segura da resposta depois que o
 * acesso ao pet já foi autorizado.
 */
export const filterPetForViewer = (
	context: AuthContext,
	pet: PetsWithRelations,
): PetsWithRelations => {
	if (context.role !== 'customer') {
		return pet;
	}

	return {
		...pet,
		// Observações internas nunca devem chegar ao customer.
		notes: [],
		// Em pets com múltiplos tutores, o customer só recebe o próprio vínculo.
		// Mesmo no próprio vínculo, dados cadastrais privados não são necessários
		// para as telas do pet e portanto são removidos da resposta.
		petTutors: pet.petTutors
			.filter(({ tutor }) => tutor.id === context.customerId)
			.map(({ tutor }) => ({
				tutor: sanitizeTutorForCustomer(tutor),
			})),
		medicalRecords: pet.medicalRecords?.map((record) => ({
			...record,
			doctor: sanitizeDoctorForCustomer(record.doctor),
		})),
		prescriptions: pet.prescriptions
			?.filter((prescription) =>
				canAccessTutorScopedData(
					context,
					prescription.documentData?.tutor.id,
				),
			)
			.map((prescription) => ({
				...prescription,
				doctor: sanitizeDoctorForCustomer(prescription.doctor),
			})),
		appointments: pet.appointments?.map((appointment) => ({
			...appointment,
			doctor: sanitizeDoctorForCustomer(appointment.doctor),
		})),
		vaccines: pet.vaccines?.map((vaccine) => ({
			...vaccine,
			doctor: sanitizeDoctorForCustomer(vaccine.doctor),
		})),
		pathologies: pet.pathologies?.map((pathology) => ({
			...pathology,
			doctor: sanitizeDoctorForCustomer(pathology.doctor),
		})),
		clinicalDocuments: pet.clinicalDocuments
			?.filter((document) =>
				canAccessTutorScopedData(context, document.documentData.tutor.id),
			)
			.map((document) => ({
				...document,
				doctor: sanitizeDoctorForCustomer(document.doctor),
			})),
		weightHistory: pet.weightHistory?.map((weight) => ({
			...weight,
			author: weight.author
				? sanitizeUserForCustomer(weight.author)
				: weight.author,
		})),
		attachments: pet.attachments?.map((attachment) => ({
			...attachment,
			author: sanitizeUserForCustomer(attachment.author),
		})),
	};
};

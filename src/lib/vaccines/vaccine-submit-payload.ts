import type { CreateVaccineSchema } from '@/api/schema/vaccine.schema';

export const buildVaccineSubmitPayload = (
	data: CreateVaccineSchema,
	reminderId: string | null,
): CreateVaccineSchema => {
	const vaccineData = { ...data };

	delete vaccineData.reminderId;

	return {
		...vaccineData,
		...(reminderId ? { reminderId } : {}),
	};
};

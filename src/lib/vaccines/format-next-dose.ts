import { formatDate } from 'date-fns';

export const formatVaccineNextDose = (
	nextDoseDate: Date | string | null | undefined,
): string => {
	if (!nextDoseDate) {
		return 'Sem próxima dose prevista';
	}

	const date = new Date(nextDoseDate);

	if (Number.isNaN(date.getTime())) {
		return 'Data não informada';
	}

	return formatDate(date, 'dd/MM/yyyy');
};

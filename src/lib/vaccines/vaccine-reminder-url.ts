export const getVaccineReminderUrl = (
	petId: string,
	reminderId: string,
	vaccineName: string,
): string => {
	const params = new URLSearchParams({
		vaccineReminder: reminderId,
		vaccineName,
	});

	return `/pets/${encodeURIComponent(petId)}?${params.toString()}`;
};

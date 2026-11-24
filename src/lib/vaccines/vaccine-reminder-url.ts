export const getVaccineReminderUrl = (
	petId: string,
	reminderId: string,
	vaccineName: string,
	appointmentId?: string,
	serviceId?: string,
	doctorId?: string,
): string => {
	const params = new URLSearchParams({
		vaccineReminder: reminderId,
		vaccineName,
	});

	if (appointmentId) params.set('appointmentId', appointmentId);
	if (serviceId) params.set('vaccineService', serviceId);
	if (doctorId) params.set('vaccineDoctor', doctorId);
	return `/pets/${encodeURIComponent(petId)}?${params.toString()}`;
};

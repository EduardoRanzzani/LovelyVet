export type ClinicalReminderListItem = {
	kind: 'care_reminder';
	id: string;
	title: string;
	type: 'vaccine';
	dueDate: string;
	status: 'pending';
	sourceServiceId: string | null;
	pet: { id: string; name: string };
	doctor: { id: string; name: string };
};

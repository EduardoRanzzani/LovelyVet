import type {
	PrescriptionDocumentData,
	PrescriptionDocumentGroup,
} from '@/api/schema/prescription-document.schema';

export function normalizePrescriptionGroups(
	documentData: PrescriptionDocumentData,
): PrescriptionDocumentGroup[] {
	if (documentData.groups?.length) {
		return documentData.groups;
	}

	const administrationRoute = documentData.administrationRoute?.trim() ?? '';

	const items = documentData.items ?? [];

	if (!administrationRoute && items.length === 0) {
		return [];
	}

	return [
		{
			administrationRoute,
			items,
		},
	];
}

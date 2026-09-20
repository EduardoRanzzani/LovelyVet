'use client';

'use client';

import A4DocumentPreview from '@/components/clinical-documents/a4-document-preview';
import PrescriptionDocument from '@/components/prescriptions/prescription-document';
import type { RefObject } from 'react';
import type { PrescriptionDraftItem } from './prescription-builder';

export interface PrescriptionPatientData {
	name: string;
	species: string;
	breed: string;
	age: string;
	weight: string;
	sex: string;
	date: string;
}

interface PrescriptionPreviewProps {
	printRef: RefObject<HTMLDivElement | null>;
	patient: PrescriptionPatientData;
	tutorName: string;
	items: PrescriptionDraftItem[];
	administrationRoute: string;
}

export default function PrescriptionPreview({
	printRef,
	patient,
	tutorName,
	items,
	administrationRoute,
}: PrescriptionPreviewProps) {
	return (
		<A4DocumentPreview>
			<PrescriptionDocument
				printRef={printRef}
				patient={{
					...patient,
					tutorName,
				}}
				items={items}
				administrationRoute={administrationRoute}
			/>
		</A4DocumentPreview>
	);
}

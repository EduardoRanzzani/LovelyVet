'use client';

import A4DocumentPreview from '@/components/clinical-documents/a4-document-preview';
import PrescriptionDocument from '@/components/prescriptions/prescription-document';
import type { RefObject } from 'react';
import type { PrescriptionDraftGroup } from './prescription-builder';

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
	groups: PrescriptionDraftGroup[];
}

export default function PrescriptionPreview({
	printRef,
	patient,
	tutorName,
	groups,
}: PrescriptionPreviewProps) {
	return (
		<A4DocumentPreview>
			<PrescriptionDocument
				printRef={printRef}
				patient={{
					...patient,
					tutorName,
				}}
				groups={groups}
			/>
		</A4DocumentPreview>
	);
}

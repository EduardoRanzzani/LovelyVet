'use client';

import A4DocumentPreview from '@/components/clinical-documents/a4-document-preview';
import PrescriptionDocument from '@/components/prescriptions/prescription-document';
import type { RefObject } from 'react';
import type { PrescriptionDraftGroup, PrescriptionDraftOrientationBlock } from './prescription-builder';

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
	orientationBlocks: PrescriptionDraftOrientationBlock[];
	isControlled?: boolean;
}

export default function PrescriptionPreview({
	printRef,
	patient,
	tutorName,
	groups,
	orientationBlocks,
	isControlled = false,
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
				orientationBlocks={orientationBlocks}
				isControlled={isControlled}
			/>
		</A4DocumentPreview>
	);
}

'use client';

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
		<div className='overflow-auto rounded-xl border bg-muted/40 p-4'>
			<PrescriptionDocument
				printRef={printRef}
				patient={{
					...patient,
					tutorName,
				}}
				items={items}
				administrationRoute={administrationRoute}
			/>
		</div>
	);
}

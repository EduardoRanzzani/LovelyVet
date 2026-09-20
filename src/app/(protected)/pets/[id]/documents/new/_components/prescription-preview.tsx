'use client';

import PrescriptionDocument from '@/components/prescriptions/prescription-document';
import { useEffect, useRef, useState, type RefObject } from 'react';
import type { PrescriptionDraftItem } from './prescription-builder';

const A4_WIDTH_PX = 210 * (96 / 25.4);
const A4_HEIGHT_PX = 297 * (96 / 25.4);

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
	const previewContainerRef = useRef<HTMLDivElement>(null);
	const [previewScale, setPreviewScale] = useState(1);

	useEffect(() => {
		const container = previewContainerRef.current;

		if (!container) return;

		const updateScale = () => {
			setPreviewScale(Math.min(container.clientWidth / A4_WIDTH_PX, 1));
		};

		updateScale();

		const observer = new ResizeObserver(updateScale);
		observer.observe(container);

		return () => observer.disconnect();
	}, []);

	return (
		<div className='overflow-hidden rounded-xl border bg-muted/40 p-2 sm:p-4'>
			<div ref={previewContainerRef} className='w-full'>
				<div
					className='mx-auto overflow-hidden'
					style={{
						width: A4_WIDTH_PX * previewScale,
						height: A4_HEIGHT_PX * previewScale,
					}}
				>
					<div
						className='origin-top-left'
						style={{
							width: A4_WIDTH_PX,
							height: A4_HEIGHT_PX,
							transform: `scale(${previewScale})`,
						}}
					>
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
				</div>
			</div>
		</div>
	);
}

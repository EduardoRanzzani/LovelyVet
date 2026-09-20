'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

const A4_WIDTH_PX = 210 * (96 / 25.4);
const A4_HEIGHT_PX = 297 * (96 / 25.4);

interface A4DocumentPreviewProps {
	children: ReactNode;
}

export default function A4DocumentPreview({
	children,
}: A4DocumentPreviewProps) {
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
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}

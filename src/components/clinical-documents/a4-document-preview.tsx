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
		<div
			data-a4-preview-shell
			className='overflow-hidden rounded-xl border bg-muted/40 p-2 sm:p-4'
		>
			<style>{`
				@media print {
					[data-a4-preview-shell],
					[data-a4-preview-container],
					[data-a4-preview-viewport],
					[data-a4-preview-page] {
						display: contents !important;
					}
				}
			`}</style>

			<div
				ref={previewContainerRef}
				data-a4-preview-container
				className='w-full'
			>
				<div
					className='mx-auto overflow-hidden'
					data-a4-preview-viewport
					style={{
						width: A4_WIDTH_PX * previewScale,
						height: A4_HEIGHT_PX * previewScale,
					}}
				>
					<div
						className='origin-top-left'
						data-a4-preview-page
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

import type { TimelineItem } from '@/api/schema/timeline.schema';
import { Badge } from '@/components/ui/badge';
import PetTimelineClient from './pet-history-timeline';

interface ClinicalHistoryPanelProps {
	title: string;
	historyEvents: TimelineItem[];
	canDelete: boolean;
	onDelete: (item: TimelineItem) => void;
}

const ClinicalHistoryPanel = ({ title, historyEvents, canDelete, onDelete }: ClinicalHistoryPanelProps) => (
	<section className='w-full min-w-0 flex-1 rounded-xl border bg-muted/20 p-3 sm:p-6'>
		<div className='flex min-w-0 items-center justify-between gap-2 border-b pb-3 sm:pb-4 mb-3 sm:mb-2'>
			<h3 className='min-w-0 text-base font-bold sm:text-lg'>{title}</h3>
			<Badge
				variant='outline'
				className='shrink-0 rounded-full border px-2 py-1 text-[10px] shadow-sm sm:text-xs'
			>
				{historyEvents.length} registro{historyEvents.length !== 1 ? 's' : ''}
			</Badge>
		</div>
		<div className='pb-2 sm:pb-4'>
			<PetTimelineClient historyEvents={historyEvents} canDelete={canDelete} onDelete={onDelete} />
		</div>
	</section>
);

export default ClinicalHistoryPanel;

import { TimelineItem } from '@/api/schema/timeline.schema';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import PetTimelineClient from './history/pet-history-timeline';

interface TabTimelineProps {
	historyEvents: TimelineItem[];
	canDelete: boolean;
	onDelete: (item: TimelineItem) => void;
}

const TabTimeline = ({
	historyEvents,
	canDelete,
	onDelete,
}: TabTimelineProps) => {
	return (
		<TabsContent value='timeline' className='min-w-0'>
			<div className='my-2 flex min-w-0 items-center justify-between gap-2 border-b pb-3 sm:pb-4'>
				<h3 className='min-w-0 text-base font-bold sm:text-lg'>Linha do Tempo</h3>
				<Badge
					variant={'outline'}
					className='shrink-0 rounded-full border px-2 py-1 text-[10px] shadow-sm sm:text-xs'
				>
					{historyEvents.length} registro
					{historyEvents.length !== 1 ? 's' : ''}
				</Badge>
			</div>

			<PetTimelineClient
				historyEvents={historyEvents}
				canDelete={canDelete}
				onDelete={onDelete}
			/>
		</TabsContent>
	);
};

export default TabTimeline;

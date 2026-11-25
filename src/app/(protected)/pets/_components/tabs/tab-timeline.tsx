import type { TimelineItem } from '@/api/schema/timeline.schema';
import { TabsContent } from '@/components/ui/tabs';
import ClinicalHistoryPanel from './history/clinical-history-panel';

interface TabTimelineProps {
	historyEvents: TimelineItem[];
	canDelete: boolean;
	onDelete: (item: TimelineItem) => void;
}

const TabTimeline = ({ historyEvents, canDelete, onDelete }: TabTimelineProps) => (
	<TabsContent value='timeline' className='w-full min-w-0'>
		<ClinicalHistoryPanel
			title='Linha do Tempo'
			historyEvents={historyEvents}
			canDelete={canDelete}
			onDelete={onDelete}
		/>
	</TabsContent>
);

export default TabTimeline;

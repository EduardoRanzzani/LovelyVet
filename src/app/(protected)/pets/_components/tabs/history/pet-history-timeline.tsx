'use client';

import { TimelineItem } from '@/api/schema/timeline.schema';
import NoHistoryTimeline from './no-history-timeline';
import { HistoryItem } from './pet-history';

interface PetTimelineClientProps {
	historyEvents: TimelineItem[];
	canDelete: boolean;
	onDelete: (item: TimelineItem) => void;
}

const PetTimelineClient = ({
	historyEvents,
	canDelete,
	onDelete,
}: PetTimelineClientProps) => {
	return (
		<div className='min-w-0 md:max-h-70 md:overflow-y-auto md:pr-2 md:scrollbar-thin md:scrollbar-thumb-muted'>
			{historyEvents.length > 0 ? (
				historyEvents.map((event, idx) => (
					<HistoryItem
						key={event.id ?? `ev-${idx}`}
						title={event.title}
						date={event.date}
						icon={event.icon}
						colorClass={event.color}
						content={event.content}
						avatarPerson={event.avatarPerson}
						canDelete={canDelete && event.canDelete !== false}
						onDelete={() => onDelete(event)}
					/>
				))
			) : (
				<NoHistoryTimeline />
			)}
		</div>
	);
};

export default PetTimelineClient;

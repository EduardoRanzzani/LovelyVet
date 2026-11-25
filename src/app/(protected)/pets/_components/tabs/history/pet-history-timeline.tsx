'use client';

import { TimelineItem } from '@/api/schema/timeline.schema';
import NoHistoryTimeline from './no-history-timeline';
import { HistoryItem } from './pet-history';

interface PetTimelineClientProps {
	historyEvents: TimelineItem[];
	canDelete: boolean;
	onDelete: (item: TimelineItem) => void;
}

const PetTimelineClient = ({ historyEvents, canDelete, onDelete }: PetTimelineClientProps) => {
	return (
		<div aria-label='Registros do histórico' className='min-w-0'>
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

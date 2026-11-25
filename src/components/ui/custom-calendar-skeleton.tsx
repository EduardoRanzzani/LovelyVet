import { Skeleton } from './skeleton';

const CustomCalendarSkeleton = () => {
	return (
		<div className={'w-full bg-card border animate-pulse rounded-xl overflow-hidden shadow-sm flex flex-col'}>
			<Skeleton className='w-full h-120 bg-zinc-100 animate-pulse' />
		</div>
	);
};

export default CustomCalendarSkeleton;

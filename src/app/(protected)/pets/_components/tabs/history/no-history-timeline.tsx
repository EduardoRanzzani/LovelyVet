import { GalleryHorizontalIcon } from 'lucide-react';

const NoHistoryTimeline = () => {
	return (
		<div className='flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-2xl bg-white/50 py-10'>
			<GalleryHorizontalIcon className='w-12 h-12 mb-3 opacity-20' />
			<p className='font-medium text-center'>O histórico deste pet está vazio.</p>
			<p className='text-xs text-center'>Comece adicionando um atendimento ou peso.</p>
		</div>
	);
};

export default NoHistoryTimeline;

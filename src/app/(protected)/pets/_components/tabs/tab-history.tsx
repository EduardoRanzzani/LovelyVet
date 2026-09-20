import { DoctorsWithRelations } from '@/api/schema/doctors.schema';
import { TimelineItem } from '@/api/schema/timeline.schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import {
	FileIcon,
	FilePenLineIcon,
	FlaskConicalIcon,
	StethoscopeIcon,
} from 'lucide-react';
import DialogNotes from '../dialogs/dialog-notes';
import DialogVaccine from '../dialogs/dialog-vaccine';
import DialogWeight from '../dialogs/dialog-weight';
import PetTimelineClient from './history/pet-history-timeline';
import Link from 'next/link';

interface TabHistoryProps {
	doctors: DoctorsWithRelations[];
	historyEvents: TimelineItem[];
	petId: string;
	canDelete: boolean;
	onDelete: (item: TimelineItem) => void;
}

const TabHistory = ({
	doctors,
	historyEvents,
	petId,
	canDelete,
	onDelete,
}: TabHistoryProps) => {
	return (
		<TabsContent value='history' className='min-w-0 w-full'>
			<div className='flex min-w-0 flex-col gap-4 lg:flex-row'>
				<div className='grid grid-cols-2 gap-2 bg-card sm:grid-cols-3 lg:max-h-30 lg:w-3/5'>
					<DialogWeight petId={petId} />

					<Button className='bg-pathology hover:bg-pathology/80'>
						<StethoscopeIcon />
						Patologia
					</Button>

					<Button className='bg-document hover:bg-document/80'>
						<FileIcon />
						Documento
					</Button>

					<Button className='bg-exam hover:bg-exam/80'>
						<FlaskConicalIcon /> Exame
					</Button>

					<DialogVaccine petId={petId} doctors={doctors} />

					<Button
						asChild
						className='col-span-2 bg-prescription text-xs hover:bg-prescription/80 sm:col-span-1 sm:text-sm'
					>
						<Link href={`/pets/${petId}/documents/new`}>
							<FilePenLineIcon />
							Receita / Encaminhamento
						</Link>
					</Button>

					<DialogNotes petId={petId} />
				</div>

				<div className='min-w-0 w-full flex-1 rounded-xl border bg-muted/20 p-3 sm:p-6 lg:max-h-100'>
					<div className='mb-3 flex min-w-0 items-center justify-between gap-2 border-b pb-3 sm:mb-2 sm:pb-4'>
						<h3 className='min-w-0 text-base font-bold sm:text-lg'>
							Histórico Clínico
						</h3>
						<Badge
							variant={'outline'}
							className='shrink-0 rounded-full border px-2 py-1 text-[10px] shadow-sm sm:text-xs'
						>
							{historyEvents.length} registro
							{historyEvents.length !== 1 ? 's' : ''}
						</Badge>
					</div>

					<div className='pb-2 sm:pb-8 lg:pb-20'>
						<PetTimelineClient
							historyEvents={historyEvents}
							canDelete={canDelete}
							onDelete={onDelete}
						/>
					</div>
				</div>
			</div>
		</TabsContent>
	);
};

export default TabHistory;

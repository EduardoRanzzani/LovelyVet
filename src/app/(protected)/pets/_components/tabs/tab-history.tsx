import { DoctorsWithRelations } from '@/api/schema/doctors.schema';
import { TimelineItem } from '@/api/schema/timeline.schema';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { FileIcon, FilePenLineIcon, FlaskConicalIcon, StethoscopeIcon } from 'lucide-react';
import DialogNotes from '../dialogs/dialog-notes';
import DialogVaccine from '../dialogs/dialog-vaccine';
import DialogWeight from '../dialogs/dialog-weight';
import ClinicalHistoryPanel from './history/clinical-history-panel';
import Link from 'next/link';

interface TabHistoryProps {
	doctors: DoctorsWithRelations[];
	vaccineServices: { id: string; name: string; priceInCents: number; specieId: string | null }[];
	historyEvents: TimelineItem[];
	petId: string;
	canDelete: boolean;
	onDelete: (item: TimelineItem) => void;
}

const TabHistory = ({ doctors, vaccineServices, historyEvents, petId, canDelete, onDelete }: TabHistoryProps) => {
	return (
		<TabsContent value='history' className='min-w-0 w-full'>
			<div className='min-w-0 gap-4 grid grid-cols-1 items-start 2xl:grid-cols-2'>
				<div
					role='group'
					aria-label='Ações clínicas'
					className='grid w-full min-w-0 content-start gap-2 bg-card grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 [&>:is(button,a)]:h-11 [&>:is(button,a)]:w-full [&>:is(button,a)]:min-w-0 [&>:is(button,a)]:whitespace-normal [&>:is(button,a)]:text-center [&>:is(button,a)]:leading-4 [&>:is(button,a)]:py-1'
				>
					<h3 className='col-span-full text-sm font-semibold text-muted-foreground'>Ações clínicas</h3>
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

					<DialogVaccine petId={petId} doctors={doctors} vaccineServices={vaccineServices} />

					<Button asChild className='bg-prescription hover:bg-prescription/80 text-sm'>
						<Link href={`/pets/${petId}/documents/new`}>
							<FilePenLineIcon />
							<span className='min-w-0 break-words'>Receita / Encaminhamento</span>
						</Link>
					</Button>

					<DialogNotes petId={petId} />
				</div>

				<ClinicalHistoryPanel
					title='Histórico Clínico'
					historyEvents={historyEvents}
					canDelete={canDelete}
					onDelete={onDelete}
				/>
			</div>
		</TabsContent>
	);
};

export default TabHistory;

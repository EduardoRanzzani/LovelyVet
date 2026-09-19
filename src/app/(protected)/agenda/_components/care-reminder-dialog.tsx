'use client';

import { updateCareReminderStatus } from '@/api/actions/care-reminders.actions';
import type { CalendarCareReminderEntry } from '@/api/schema/calendar.schema';
import { Button } from '@/components/ui/button';
import {
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import LoadingDialog from '@/components/ui/loading';
import { CheckCircle2Icon, XCircleIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

interface CareReminderDialogProps {
	reminder: CalendarCareReminderEntry;
	onSuccess?: () => void;
}

const CareReminderDialog = ({
	reminder,
	onSuccess,
}: CareReminderDialogProps) => {
	const action = useAction(updateCareReminderStatus, {
		onSuccess: ({ input }) => {
			toast.success(
				input.status === 'completed'
					? 'Lembrete concluído com sucesso.'
					: 'Lembrete cancelado.',
			);

			onSuccess?.();
		},

		onError: ({ error }) => {
			toast.error(
				error.serverError ?? 'Não foi possível atualizar o lembrete.',
			);
		},
	});

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>{reminder.title}</DialogTitle>

				<DialogDescription>
					Lembrete de cuidado do pet <strong>{reminder.pet.name}</strong>.
				</DialogDescription>
			</DialogHeader>

			<div className='flex flex-col gap-2 text-sm'>
				<div>
					<span className='font-medium'>Pet:</span> {reminder.pet.name}
				</div>

				<div>
					<span className='font-medium'>Data:</span>{' '}
					{reminder.dueDate.split('-').reverse().join('/')}
				</div>

				<p className='text-muted-foreground'>
					Concluir este lembrete não cria automaticamente outra dose. Um novo
					lembrete será criado quando a próxima aplicação da vacina for
					registrada.
				</p>
			</div>

			{action.isPending && <LoadingDialog />}

			<DialogFooter className='gap-2'>
				<Button
					type='button'
					variant='destructive'
					disabled={action.isPending}
					onClick={() =>
						action.execute({
							id: reminder.id,
							status: 'cancelled',
						})
					}
				>
					<XCircleIcon />
					Cancelar lembrete
				</Button>

				<Button
					type='button'
					disabled={action.isPending}
					onClick={() =>
						action.execute({
							id: reminder.id,
							status: 'completed',
						})
					}
				>
					<CheckCircle2Icon />
					Concluir
				</Button>
			</DialogFooter>
		</DialogContent>
	);
};

export default CareReminderDialog;

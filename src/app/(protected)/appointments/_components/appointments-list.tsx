'use client';

import {
	deleteAppointment,
	markAppointmentAsCancelled,
	markAppointmentAsCompleted,
	markAsConfirmed,
} from '@/api/actions/appointments.actions';
import type { AppointmentListItem } from '@/api/schema/appointments.schema';
import type { ClinicalReminderListItem } from '@/api/schema/clinical-reminders.schema';
import type { DoctorOption } from '@/api/schema/doctors.schema';
import { formatPetTutorNames, type PetOption } from '@/api/schema/pets.schema';
import type { ServicesWithRelations } from '@/api/schema/services.schema';
import { MAX_PAGE_SIZE, type PaginatedData } from '@/api/config/consts';
import type { BillingOverview } from '@/lib/finance/billing-queries';
import {
	isStaff,
	summarizeAppointmentItems,
} from '@/lib/appointments/appointment-list-presentation';
import type { UserRole } from '@/lib/security/roles';
import { formatCurrencyFromCents } from '@/helpers/currency';
import AddButton from '@/components/list/add-button';
import EditButton from '@/components/list/edit-button';
import SearchInput from '@/components/list/search-input';
import Pagination from '@/components/list/table-pagination';
import LoadingDialog from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	CalendarDays,
	Bell,
	MoreHorizontal,
	Check,
	CheckCheck,
	Pencil,
	Trash2,
	Syringe,
	PawPrint,
	Wallet,
	Clock3,
	Ban,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAction } from 'next-safe-action/hooks';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { use, useState } from 'react';
import { toast } from 'sonner';
import AppointmentFormClient from './appointment-form';
import AppointmentItemsEditor from './appointment-items-editor';
import AppointmentBillingEditor from './appointment-billing-editor';
import BadgeStatus from './badge-status';

type ProductOption = {
	id: string;
	name: string;
	priceInCents: number;
	active: boolean;
};
type Props = {
	appointments: Promise<PaginatedData<AppointmentListItem>>;
	reminders: Promise<PaginatedData<ClinicalReminderListItem>>;
	billing: Promise<Record<string, BillingOverview>>;
	pets: PetOption[];
	doctors: DoctorOption[];
	services: ServicesWithRelations[];
	products: ProductOption[];
	viewerRole: UserRole;
};

/** Ações secundárias permanecem montadas fora de menus descartáveis: os dialogs não fecham por desmontagem. */
function AppointmentActions({
  appointment, billing, pets, doctors, services, products, viewerRole, onDelete, onConfirm, onComplete, onCancel,
}: {
  appointment: AppointmentListItem;
  billing?: BillingOverview;
  pets: PetOption[];
  doctors: DoctorOption[];
  services: ServicesWithRelations[];
  products: ProductOption[];
  viewerRole: UserRole;
  onDelete: (id: string) => void;
  onConfirm: (id: string) => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const staff = isStaff(viewerRole);
  const billed = Boolean(billing);
  const [itemsOpen, setItemsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<'confirm' | 'complete' | 'delete' | 'cancel' | null>(null);
  const availableConfirmation = appointment.status === 'pending';
  const availableCompletion = ['confirmed', 'in_progress'].includes(appointment.status);
  const availableItems = staff && !appointment.isPaid && !billed && !['cancelled', 'no_show'].includes(appointment.status);

  const executeConfirmedAction = () => {
    switch (confirmation) {
      case 'confirm': onConfirm(appointment.id); break;
      case 'complete': onComplete(appointment.id); break;
      case 'delete': onDelete(appointment.id); break;
      case 'cancel': onCancel(appointment.id); break;
    }
    setConfirmation(null);
  };

  return (
    <>
      <div className='flex items-center justify-end gap-1.5 whitespace-nowrap'>
        {staff && appointment.status === 'completed' && (
          <EditButton tooltip='Financeiro: cobrança e pagamentos' text='Financeiro' size='default' renderForm={(close) => (
            <AppointmentBillingEditor appointment={appointment} billing={billing} onSuccess={close} />
          )} />
        )}
        <EditButton
          tooltip='Editar agendamento'
          disabled={appointment.status !== 'pending' || Boolean(appointment.productItems?.length)}
          renderForm={(close) => (
            <AppointmentFormClient appointment={appointment} pets={pets} doctors={doctors} services={services} viewerRole={viewerRole} onSuccess={close} />
          )}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type='button' size='icon' variant='outline' aria-label='Mais ações do atendimento'>
              <MoreHorizontal className='size-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' sideOffset={6} className='w-52'>
            {staff && (
              <>
                <DropdownMenuItem disabled={!availableConfirmation} onSelect={() => setConfirmation('confirm')}>
                  <Check className='size-4' />Confirmar atendimento
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!availableCompletion} onSelect={() => setConfirmation('complete')}>
                  <CheckCheck className='size-4' />Concluir atendimento
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!availableItems} onSelect={() => setItemsOpen(true)}>
                  <Pencil className='size-4' />Editar itens e valores
                </DropdownMenuItem>
                <DropdownMenuItem variant='destructive' disabled={billed} onSelect={() => setConfirmation('delete')}>
                  <Trash2 className='size-4' />Excluir atendimento
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem variant='destructive' disabled={!availableConfirmation} onSelect={() => setConfirmation('cancel')}>
              <Ban className='size-4' />Cancelar agendamento
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* O editor e a confirmação ficam fora do DropdownMenu para não desmontarem ao fechar o menu. */}
      <Dialog open={itemsOpen} onOpenChange={setItemsOpen}>
        {itemsOpen && (
          <AppointmentItemsEditor
            appointment={appointment}
            services={services}
            products={products}
            onSuccess={() => setItemsOpen(false)}
          />
        )}
      </Dialog>
      <AlertDialog open={confirmation !== null} onOpenChange={(open) => { if (!open) setConfirmation(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar ação no atendimento?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation === 'delete'
                ? 'A exclusão é definitiva e somente será permitida se não houver vínculos clínicos ou financeiros.'
                : confirmation === 'cancel'
                  ? 'Deseja cancelar este agendamento?'
                  : confirmation === 'complete'
                    ? 'Deseja marcar o atendimento como concluído?'
                    : 'Deseja confirmar este agendamento?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={executeConfirmedAction} variant={confirmation === 'delete' ? 'destructive' : 'default'}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const appointmentDate = (date: Date) =>
	format(new Date(date), "dd/MM/yyyy 'às' HH:mm");
const reminderDate = (date: string) => format(parseISO(date), 'dd/MM/yyyy');

function ReminderRow({
	reminder,
	mobile,
}: {
	reminder: ClinicalReminderListItem;
	mobile?: boolean;
}) {
	const link = `/pets/${encodeURIComponent(reminder.pet.id)}`;
	if (mobile) {
		return (
			<article
				className='space-y-3 rounded-xl border bg-card p-3'
				data-testid='reminder-card'
			>
				<div className='flex items-start justify-between gap-2'>
					<div className='min-w-0'>
						<Link
							href={link}
							className='font-semibold underline-offset-4 hover:underline'
						>
							{reminder.pet.name}
						</Link>
						<p className='mt-1 text-xs text-muted-foreground'>
							{reminderDate(reminder.dueDate)} · Vacina
						</p>
					</div>
					<span className='shrink-0 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200'>
						Pendente
					</span>
				</div>
				<p className='wrap-break-word text-sm'>
					<Syringe className='mr-2 inline size-4' />
					{reminder.title}
				</p>
				<Link
					href={link}
					className='inline-flex min-h-11 items-center rounded-md bg-emerald-100 px-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-100'
				>
					Ver pet
				</Link>
			</article>
		);
	}
	return (
		<TableRow data-testid='reminder-row'>
			<TableCell className='whitespace-nowrap'>
				{reminderDate(reminder.dueDate)}
			</TableCell>
			<TableCell>
				<Link
					href={link}
					className='font-semibold underline-offset-4 hover:underline'
				>
					{reminder.pet.name}
				</Link>
			</TableCell>
			<TableCell>
				<span className='inline-flex items-center gap-1 text-xs'>
					<Syringe className='size-4' />
					Vacina
				</span>
			</TableCell>
			<TableCell className='max-w-64'>
				<p className='line-clamp-2'>{reminder.title}</p>
			</TableCell>
			<TableCell>
				<span className='whitespace-nowrap rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200'>
					Retorno pendente
				</span>
			</TableCell>
			<TableCell>
				<Link
					href={link}
					className='inline-flex min-h-9 items-center rounded-md px-3 font-semibold text-emerald-800 underline underline-offset-4 hover:bg-emerald-100 hover:text-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950'
				>
					Ver pet
				</Link>
			</TableCell>
		</TableRow>
	);
}

export default function AppointmentsListClient({
	appointments,
	reminders,
	billing,
	pets,
	doctors,
	services,
	products,
	viewerRole,
}: Props) {
	const appointmentData = use(appointments);
	const reminderData = use(reminders);
	const billed = use(billing);
	const params = useSearchParams();
	const router = useRouter();
	const [status, setStatus] = useState('all');
	const [mobileTab, setMobileTab] = useState('appointments');

	const navigatePage = (
		key: 'appointmentsPage' | 'remindersPage',
		page: number,
	) => {
		const next = new URLSearchParams(params.toString());
		next.set(key, String(page));
		router.push(`/appointments?${next.toString()}`);
	};

	const deletion = useAction(deleteAppointment, {
		onSuccess: () => {
			toast.success('Atendimento excluído.');
			router.refresh();
		},
		onError: ({ error }) =>
			toast.error(
				error.serverError ??
					'Não foi possível excluir. Verifique os vínculos clínicos e financeiros.',
			),
	});
	const confirmation = useAction(markAsConfirmed, {
		onSuccess: () => {
			toast.success('Atendimento confirmado.');
			router.refresh();
		},
		onError: ({ error }) =>
			toast.error(
				error.serverError ?? 'Não foi possível confirmar o atendimento.',
			),
	});
	const completion = useAction(markAppointmentAsCompleted, {
		onSuccess: () => {
			toast.success('Atendimento concluído.');
			router.refresh();
		},
		onError: ({ error }) =>
			toast.error(
				error.serverError ?? 'Não foi possível concluir o atendimento.',
			),
	});
	const cancellation = useAction(markAppointmentAsCancelled, {
		onSuccess: () => {
			toast.success('Atendimento cancelado.');
			router.refresh();
		},
		onError: ({ error }) =>
			toast.error(
				error.serverError ?? 'Não foi possível cancelar o atendimento.',
			),
	});
	// Filtro visual explícito da página atual; a busca textual consulta o servidor.
	const visibleAppointments =
		status === 'all'
			? appointmentData.data
			: appointmentData.data.filter(
					(appointment) => appointment.status === status,
				);

	const renderActions = (appointment: AppointmentListItem) => (
		<AppointmentActions
			appointment={appointment}
			billing={billed[appointment.id]}
			pets={pets}
			doctors={doctors}
			services={services}
			products={products}
			viewerRole={viewerRole}
			onDelete={(id) => deletion.execute({ id })}
			onConfirm={(id) => confirmation.execute({ id })}
			onComplete={(id) => completion.execute({ id })}
			onCancel={(id) => cancellation.execute({ id })}
		/>
	);
	const appointmentSection = (
		<div className='space-y-4'>
			<div className='flex flex-col justify-between gap-3 sm:flex-row sm:items-center'>
				<div className='flex items-center gap-3'>
					<div className='rounded-xl bg-emerald-100 p-2.5 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'>
						<CalendarDays className='size-5' />
					</div>
					<div>
						<h2 className='font-semibold text-lg'>Agendamentos</h2>
						<p className='text-sm text-muted-foreground'>
							Atendimentos programados e realizados.
						</p>
					</div>
				</div>
				<AddButton
					text='Adicionar agendamento'
					renderForm={(close) => (
						<AppointmentFormClient
							pets={pets}
							doctors={doctors}
							services={services}
							viewerRole={viewerRole}
							onSuccess={close}
						/>
					)}
				/>
			</div>
			<div className='flex flex-wrap items-center gap-2'>
				<label
					htmlFor='appointment-status-filter'
					className='text-xs text-muted-foreground'
				>
					Status nesta página
				</label>
				<Select value={status} onValueChange={setStatus}>
					<SelectTrigger
						id='appointment-status-filter'
						className='w-44'
						aria-label='Filtrar status nesta página'
					>
						<SelectValue placeholder='Todos' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>Todos</SelectItem>
						<SelectItem value='pending'>Pendente</SelectItem>
						<SelectItem value='confirmed'>Confirmado</SelectItem>
						<SelectItem value='in_progress'>Em andamento</SelectItem>
						<SelectItem value='completed'>Concluído</SelectItem>
						<SelectItem value='cancelled'>Cancelado</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className='hidden overflow-x-auto rounded-xl border lg:block'>
				<Table>
					<TableHeader>
						<TableRow className='bg-muted/50'>
							<TableHead>Data e hora</TableHead>
							<TableHead>Paciente</TableHead>
							<TableHead>Tutor</TableHead>
							<TableHead>Descrição</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Valor</TableHead>
							<TableHead className='text-right'>Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{visibleAppointments.map((appointment) => (
							<TableRow key={appointment.id} data-testid='appointment-row'>
								<TableCell className='whitespace-nowrap text-sm'>
									{appointmentDate(appointment.scheduledAt)}
								</TableCell>
								<TableCell>
									<Link
										className='font-semibold underline-offset-4 hover:underline'
										href={`/pets/${encodeURIComponent(appointment.pet.id)}`}
									>
										{appointment.pet.name}
									</Link>
								</TableCell>
								<TableCell className='text-sm'>
									{formatPetTutorNames(appointment.pet) || '—'}
								</TableCell>
								<TableCell className='max-w-48'>
									<p
										className='truncate text-sm'
										title={summarizeAppointmentItems(appointment)}
									>
										{summarizeAppointmentItems(appointment)}
									</p>
								</TableCell>
								<TableCell>
									<BadgeStatus appointment={appointment} />
								</TableCell>
								<TableCell className='whitespace-nowrap text-sm'>
									<span className='font-medium'>
										{formatCurrencyFromCents(appointment.totalPriceInCents)}
									</span>
									{billed[appointment.id] && (
										<p className='text-xs text-muted-foreground'>
											Cobrança: {billed[appointment.id].status}
										</p>
									)}
								</TableCell>
								<TableCell>
									<div className='flex justify-end'>
										{renderActions(appointment)}
									</div>
								</TableCell>
							</TableRow>
						))}
						{visibleAppointments.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={7}
									className='py-8 text-center text-sm text-muted-foreground'
								>
									Nenhum atendimento nesta visualização.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className='space-y-3 lg:hidden'>
				{visibleAppointments.map((appointment) => (
					<article
						key={appointment.id}
						className='space-y-3 rounded-xl border bg-card p-3 shadow-sm'
						data-testid='appointment-card'
					>
						<div className='flex flex-wrap items-start justify-between gap-2'>
							<div className='flex items-center gap-2'>
								<span className='rounded-lg bg-emerald-100 p-2 text-emerald-900'>
									<PawPrint className='size-4' />
								</span>
								<Link
									href={`/pets/${encodeURIComponent(appointment.pet.id)}`}
									className='font-semibold underline-offset-4 hover:underline'
								>
									{appointment.pet.name}
								</Link>
							</div>
							<BadgeStatus appointment={appointment} />
						</div>
						<div className='space-y-1.5 pl-1 text-sm'>
							<p>
								<CalendarDays className='mr-2 inline size-4 text-muted-foreground' />
								{appointmentDate(appointment.scheduledAt)}
							</p>
							<p className='text-muted-foreground'>
								{formatPetTutorNames(appointment.pet) || 'Tutor não informado'}
							</p>
							<p className='wrap-break-word'>
								{summarizeAppointmentItems(appointment)}
							</p>
							<p className='font-semibold'>
								<Wallet className='mr-2 inline size-4' />
								{formatCurrencyFromCents(appointment.totalPriceInCents)}
							</p>
						</div>
						<div className='flex justify-end border-t pt-2'>
							{renderActions(appointment)}
						</div>
					</article>
				))}
				{visibleAppointments.length === 0 && (
					<p className='rounded-xl border p-6 text-center text-sm text-muted-foreground'>
						Nenhum atendimento nesta visualização.
					</p>
				)}
			</div>
			{appointmentData.metadata.pageCount > 1 && (
				<Pagination
					currentPage={appointmentData.metadata.currentPage}
					totalPages={appointmentData.metadata.pageCount}
					totalElements={appointmentData.metadata.totalCount}
					pageSize={MAX_PAGE_SIZE}
					onPageChange={(page) => navigatePage('appointmentsPage', page)}
				/>
			)}
		</div>
	);
	const reminderSection = (
		<div className='space-y-4'>
			<div className='flex items-center gap-3'>
				<div className='rounded-xl bg-emerald-100 p-2.5 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'>
					<Bell className='size-5' />
				</div>
				<div>
					<h2 className='font-semibold text-lg'>Retornos e lembretes</h2>
					<p className='text-sm text-muted-foreground'>
						Acompanhamento clínico, sem cobrança antecipada.
					</p>
				</div>
			</div>
			<div className='hidden overflow-x-auto rounded-xl border lg:block'>
				<Table>
					<TableHeader>
						<TableRow className='bg-muted/50'>
							<TableHead>Data prevista</TableHead>
							<TableHead>Paciente</TableHead>
							<TableHead>Tipo</TableHead>
							<TableHead>Descrição</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Ação</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{reminderData.data.map((reminder) => (
							<ReminderRow key={reminder.id} reminder={reminder} />
						))}
						{reminderData.data.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={6}
									className='py-8 text-center text-sm text-muted-foreground'
								>
									Nenhum retorno pendente encontrado.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className='space-y-3 lg:hidden'>
				{reminderData.data.map((reminder) => (
					<ReminderRow key={reminder.id} reminder={reminder} mobile />
				))}
				{reminderData.data.length === 0 && (
					<p className='rounded-xl border p-6 text-center text-sm text-muted-foreground'>
						Nenhum retorno pendente encontrado.
					</p>
				)}
			</div>
			{reminderData.metadata.pageCount > 1 && (
				<Pagination
					currentPage={reminderData.metadata.currentPage}
					totalPages={reminderData.metadata.pageCount}
					totalElements={reminderData.metadata.totalCount}
					pageSize={MAX_PAGE_SIZE}
					onPageChange={(page) => navigatePage('remindersPage', page)}
				/>
			)}
		</div>
	);

	return (
		<div className='w-full min-w-0 space-y-5'>
			{(deletion.isPending ||
				confirmation.isPending ||
				completion.isPending ||
				cancellation.isPending) && <LoadingDialog />}
			<div className='w-full'>
				<SearchInput />
			</div>
			<div className='hidden space-y-5 lg:block'>
				<section
					aria-label='Atendimentos e agendamentos'
					className='rounded-2xl border bg-card p-4 shadow-sm xl:p-5'
				>
					{appointmentSection}
				</section>
				<section
					aria-label='Retornos e lembretes'
					className='rounded-2xl border bg-card p-4 shadow-sm xl:p-5'
				>
					{reminderSection}
				</section>
			</div>
			<Tabs
				value={mobileTab}
				onValueChange={setMobileTab}
				className='lg:hidden'
			>
				<TabsList className='grid h-11 w-full grid-cols-2'>
					<TabsTrigger value='appointments'>
						Agendamentos ({appointmentData.metadata.totalCount})
					</TabsTrigger>
					<TabsTrigger value='reminders'>
						Retornos ({reminderData.metadata.totalCount})
					</TabsTrigger>
				</TabsList>
				<TabsContent value='appointments' className='pt-3'>
					{appointmentSection}
				</TabsContent>
				<TabsContent value='reminders' className='pt-3'>
					{reminderSection}
				</TabsContent>
			</Tabs>
			<p className='text-xs text-muted-foreground'>
				<Clock3 className='mr-1 inline size-3' />
				Retornos são pendências clínicas e não geram cobrança até a realização
				do atendimento.
			</p>
		</div>
	);
}

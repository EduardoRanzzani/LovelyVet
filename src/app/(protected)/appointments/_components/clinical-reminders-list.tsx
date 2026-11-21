'use client';

import type { PaginatedData } from '@/api/config/consts';
import type { ClinicalReminderListItem } from '@/api/schema/clinical-reminders.schema';
import { Button } from '@/components/ui/button';
import { format, isBefore, isSameDay, parseISO, startOfDay } from 'date-fns';
import { CalendarDaysIcon, SyringeIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { use } from 'react';

interface ClinicalRemindersListProps {
  reminders: Promise<PaginatedData<ClinicalReminderListItem>>;
}

const ClinicalRemindersList = ({ reminders }: ClinicalRemindersListProps) => {
  const { data, metadata } = use(reminders);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const today = startOfDay(new Date());

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('reminderPage', String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <section aria-labelledby='clinical-reminders-title' className='space-y-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div>
          <h2 id='clinical-reminders-title' className='text-lg font-semibold'>Retornos e lembretes</h2>
          <p className='text-sm text-muted-foreground'>Pendências clínicas, inclusive reforços de vacina. Não representam cobranças.</p>
        </div>
        <span className='rounded-full border px-2.5 py-1 text-xs font-medium'>
          {metadata.totalCount} pendente(s)
        </span>
      </div>

      {data.length === 0 ? (
        <p className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
          Nenhum retorno ou lembrete pendente encontrado.
        </p>
      ) : (
        <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
          {data.map((reminder) => {
            const dueDate = parseISO(reminder.dueDate);
            const overdue = isBefore(dueDate, today);
            const dueToday = isSameDay(dueDate, today);
            return (
              <article key={reminder.id} className='min-w-0 rounded-lg border p-3 sm:p-4'>
                <div className='flex flex-wrap items-start justify-between gap-2'>
                  <span className='inline-flex items-center gap-1.5 text-sm font-semibold'>
                    <SyringeIcon className='size-4 shrink-0' aria-hidden='true' />
                    Retorno de vacinação
                  </span>
                  <span className={overdue
                    ? 'rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:bg-red-950 dark:text-red-200'
                    : dueToday
                      ? 'rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                      : 'rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground'}>
                    {overdue ? 'Atrasado' : dueToday ? 'Hoje' : 'Pendente'}
                  </span>
                </div>
                <div className='mt-3 space-y-1.5'>
                  <Link href={`/pets/${encodeURIComponent(reminder.pet.id)}`}
                    className='inline-flex min-h-11 items-center font-semibold text-foreground underline underline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2'>
                    {reminder.pet.name}
                  </Link>
                  <p className='break-words text-sm'>{reminder.title}</p>
                  <p className='flex items-center gap-1.5 text-sm text-muted-foreground'>
                    <CalendarDaysIcon className='size-4 shrink-0' aria-hidden='true' />
                    {format(dueDate, 'dd/MM/yyyy')} · Sem horário definido
                  </p>
                  <p className='text-xs text-muted-foreground'>Veterinária(o): {reminder.doctor.name}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {metadata.pageCount > 1 && (
        <nav aria-label='Páginas dos lembretes' className='flex items-center justify-between gap-3'>
          <Button type='button' variant='outline' size='sm' className='min-h-11'
            disabled={metadata.currentPage <= 1}
            onClick={() => goToPage(metadata.currentPage - 1)}>Anterior</Button>
          <span className='text-xs text-muted-foreground'>Página {metadata.currentPage} de {metadata.pageCount}</span>
          <Button type='button' variant='outline' size='sm' className='min-h-11'
            disabled={metadata.currentPage >= metadata.pageCount}
            onClick={() => goToPage(metadata.currentPage + 1)}>Próxima</Button>
        </nav>
      )}
    </section>
  );
};

export default ClinicalRemindersList;

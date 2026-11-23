'use client';

import { Button } from '@/components/ui/button';
import { addMonths, format, isValid, parse, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  month: string;
  onMonthChange: (month: string) => void;
  title?: string;
};

/** Navegação mensal no mesmo padrão do cabeçalho do CustomCalendar. */
export function MonthNavigator({ month, onMonthChange, title }: Props) {
  const date = parse(month, 'yyyy-MM', new Date());
  const safeDate = /^\d{4}-(0[1-9]|1[0-2])$/.test(month) && isValid(date)
    ? date
    : new Date();

  const change = (next: Date) => onMonthChange(format(next, 'yyyy-MM'));

  return (
    <div className='flex min-h-16 items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm'>
      <div className='min-w-0'>
        {title && <p className='text-xs text-muted-foreground'>{title}</p>}
        <h2 className='text-lg font-bold capitalize' aria-live='polite'>
          {format(safeDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
      </div>
      <div className='flex shrink-0 gap-2'>
        <Button type='button' variant='outline' size='icon' className='h-8 w-8' aria-label='Mês anterior' onClick={() => change(subMonths(safeDate, 1))}>
          <ChevronLeft className='h-4 w-4' />
        </Button>
        <Button type='button' variant='outline' size='icon' className='h-8 w-8' aria-label='Próximo mês' onClick={() => change(addMonths(safeDate, 1))}>
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}

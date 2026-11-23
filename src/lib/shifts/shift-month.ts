import { monthNames } from '@/api/config/consts';

/** Interpreta o mês da URL sem perder o ano; mantém compatibilidade com links antigos. */
export function resolveShiftMonth(value?: string | null, fallback = new Date()): Date {
  if (value) {
    const numeric = /^(\d{4})-(\d{2})$/.exec(value);
    if (numeric) {
      const year = Number(numeric[1]);
      const month = Number(numeric[2]);
      if (year >= 1900 && year <= 9999 && month >= 1 && month <= 12) {
        return new Date(year, month - 1, 1);
      }
    }

    const oldMonth = monthNames.indexOf(value.toLowerCase());
    if (oldMonth >= 0) {
      return new Date(fallback.getFullYear(), oldMonth, 1);
    }
  }
  return new Date(fallback.getFullYear(), fallback.getMonth(), 1);
}

/** Usa o calendário local para evitar troca de mês por conversão UTC. */
export function formatShiftMonth(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
}

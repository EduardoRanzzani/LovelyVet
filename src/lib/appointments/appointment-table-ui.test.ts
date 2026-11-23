import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Regressões de estrutura: o menu deve ser portaled, não aumentar a altura da linha.
const list = readFileSync(resolve(process.cwd(), 'src/app/(protected)/appointments/_components/appointments-list.tsx'), 'utf8');
const table = readFileSync(resolve(process.cwd(), 'src/components/ui/table.tsx'), 'utf8');

describe('interface de agendamentos', () => {
  it('usa o DropdownMenu do projeto para ações secundárias', () => {
    expect(list).toContain("from '@/components/ui/dropdown-menu'");
    expect(list).toContain('<DropdownMenuContent align=');
    expect(list).not.toContain('setExpanded(');
  });
  it('mantém os diálogos fora do menu descartável', () => {
    const endMenu = list.indexOf('</DropdownMenu>');
    expect(endMenu).toBeGreaterThan(0);
    expect(list.indexOf('<Dialog open={itemsOpen}')).toBeGreaterThan(endMenu);
    expect(list.indexOf('<AlertDialog open={confirmation !== null}')).toBeGreaterThan(endMenu);
  });
  it('usa o cabeçalho cinza compartilhado e um link de retorno legível', () => {
    expect(table).toContain('[&_tr]:bg-muted/60');
    expect(list).toContain('text-emerald-800 underline');
    expect(list).toContain('dark:text-emerald-300');
  });
});

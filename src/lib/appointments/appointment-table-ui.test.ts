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
    const alertDialog = list.indexOf('<AlertDialog\n');
    expect(alertDialog).toBeGreaterThan(endMenu);
    expect(list).toContain('open={confirmationRequest !== null}');
    expect(list).toContain('if (!open && !actionPending) setConfirmationRequest(null)');
    // A confirmação não pode ser desmontada junto com o menu ao selecionar uma ação.
    const menuMarkup = list.slice(list.indexOf('<DropdownMenu>'), endMenu);
    expect(menuMarkup).not.toContain('<AlertDialog');
    expect(menuMarkup).not.toContain('<Dialog open=');
  });
  it('usa o cabeçalho cinza e botões compactos para agendar e ver o pet', () => {
    expect(table).toContain('[&_tr]:bg-muted/60');
    expect(list).toContain('Agendar');
    expect(list).toContain('<Button asChild');
    expect(list).toContain("variant='secondary' size='sm'");
    expect(list).toContain('<PawPrint className=');
    expect(list).toContain('Ver pet');
    expect(list).toContain('aria-label={`Ver detalhes de ${reminder.pet.name}`}');
    expect(list).not.toContain('text-emerald-800 underline');
  });
  it('adapta o cabeçalho à largura do conteúdo e evita que o botão comprima o título', () => {
    const header = list.slice(list.indexOf('const appointmentSection = ('), list.indexOf("htmlFor='appointment-status-filter'"));
    expect(header).toContain("className='@container space-y-4'");
    expect(header).toContain('flex flex-col gap-3 @min-[36rem]:flex-row');
    expect(header).toContain('flex min-w-0 flex-1 items-center');
    expect(header).toContain('shrink-0 rounded-xl');
    expect(header).toContain('w-full min-w-0 @min-[36rem]:w-60 @min-[36rem]:shrink-0 [&>button]:w-full');
    expect(header).toContain('<AddButton');
    expect(header).not.toContain('sm:flex-row');
  });
});

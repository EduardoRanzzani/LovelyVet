'use client';
import { updateAppointmentItems } from '@/api/actions/appointment-items.actions';
import type { AppointmentListItem } from '@/api/schema/appointments.schema';
import type { ServicesWithRelations } from '@/api/schema/services.schema';
import { totalForItems } from '@/lib/appointments/appointment-items';
import { formatCurrencyFromCents } from '@/helpers/currency';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { toast } from 'sonner';

type Product = { id: string; name: string; priceInCents: number; active: boolean };
type ItemLine = { id: string; quantity: number; unitPriceInCents: number; discountInCents: number };
export default function AppointmentItemsEditor({ appointment, services, products, onSuccess }: {
	appointment: AppointmentListItem; services: ServicesWithRelations[]; products: Product[]; onSuccess?: () => void;
}) {
	const [serviceLines, setServiceLines] = useState<ItemLine[]>(() => appointment.items.map((item) => ({
		id: item.serviceId, quantity: item.quantity, unitPriceInCents: item.priceAtTimeInCents, discountInCents: item.discountInCents,
	})));
	const [productLines, setProductLines] = useState<ItemLine[]>(() => (appointment.productItems ?? []).map((item) => ({
		id: item.productId, quantity: item.quantity, unitPriceInCents: item.priceAtTimeInCents, discountInCents: item.discountInCents,
	})));
	const [kind, setKind] = useState<'service' | 'product'>('service');
	const [selectedId, setSelectedId] = useState('');
	const action = useAction(updateAppointmentItems, {
		onSuccess: () => { toast.success('Itens do atendimento atualizados'); onSuccess?.(); },
		onError: ({ error }) => toast.error(error.serverError ?? 'Não foi possível atualizar os itens.'),
	});
	const addItem = () => {
		const catalogue = kind === 'service' ? services : products.filter((p) => p.active);
		const record = catalogue.find((entry) => entry.id === selectedId);
		if (!record) return;
		const lines = kind === 'service' ? serviceLines : productLines;
		if (lines.some((line) => line.id === selectedId)) { toast.error('Item já adicionado. Ajuste a quantidade.'); return; }
		const added = [...lines, { id: record.id, quantity: 1, unitPriceInCents: record.priceInCents, discountInCents: 0 }];
		if (kind === 'service') setServiceLines(added); else setProductLines(added);
		setSelectedId('');
	};
	const changeLine = (target: 'service' | 'product', id: string, field: keyof Omit<ItemLine, 'id'>, value: number) => {
		const setter = target === 'service' ? setServiceLines : setProductLines;
		setter((prev) => prev.map((line) => line.id === id ? { ...line, [field]: value } : line));
	};
	const removeLine = (target: 'service' | 'product', id: string) => {
		const setter = target === 'service' ? setServiceLines : setProductLines;
		setter((prev) => prev.filter((line) => line.id !== id));
	};
	let total: number | null = null;
	try { total = totalForItems([...serviceLines, ...productLines]); } catch { total = null; }
	const renderLines = (lines: ItemLine[], target: 'service' | 'product') => lines.map((line) => {
		const name = target === 'service' ? (services.find((x) => x.id === line.id)?.name ?? 'Serviço') : (products.find((x) => x.id === line.id)?.name ?? 'Produto');
		return <div key={`${target}-${line.id}`} className='grid grid-cols-2 items-end gap-2 rounded-md border p-2 sm:grid-cols-[minmax(0,1fr)_5rem_7rem_7rem_auto]'>
			<span className='col-span-2 break-words text-sm font-medium sm:col-span-1'>{name}</span>
			<label className='text-xs'>Qtd.<input aria-label={`Quantidade de ${name}`} type='number' min={1} max={999} step={1} className='mt-1 w-full rounded border bg-background p-2' value={line.quantity} onChange={(e) => changeLine(target, line.id, 'quantity', Number(e.target.value))} /></label>
			<label className='text-xs'>Unitário (R$)<input aria-label={`Preço unitário de ${name}`} type='number' min={0} max={1000000} step='0.01' className='mt-1 w-full rounded border bg-background p-2' value={(line.unitPriceInCents / 100).toFixed(2)} onChange={(e) => changeLine(target, line.id, 'unitPriceInCents', Math.round(Number(e.target.value) * 100))} /></label>
			<label className='text-xs'>Desconto (R$)<input aria-label={`Desconto de ${name}`} type='number' min={0} step='0.01' className='mt-1 w-full rounded border bg-background p-2' value={(line.discountInCents / 100).toFixed(2)} onChange={(e) => changeLine(target, line.id, 'discountInCents', Math.round(Number(e.target.value) * 100))} /></label>
			<Button type='button' variant='outline' onClick={() => removeLine(target, line.id)}>Remover</Button>
		</div>;
	});
	return <DialogContent className='max-h-[95dvh] overflow-y-auto sm:max-w-3xl'>
		<DialogHeader><DialogTitle>Itens do atendimento</DialogTitle><DialogDescription>{appointment.pet.name} — preços históricos, quantidades e descontos. Vacinas vinculadas ao prontuário não podem ser removidas.</DialogDescription></DialogHeader>
		<div className='space-y-3'>
			<div className='grid gap-2 sm:grid-cols-[9rem_minmax(0,1fr)_auto]'>
				<select aria-label='Tipo de item' className='rounded-md border bg-background p-2' value={kind} onChange={(e) => { setKind(e.target.value as 'service' | 'product'); setSelectedId(''); }}><option value='service'>Serviço</option><option value='product'>Produto</option></select>
				<select aria-label='Item do catálogo' className='min-w-0 rounded-md border bg-background p-2' value={selectedId} onChange={(e) => setSelectedId(e.target.value)}><option value=''>Selecionar item</option>{(kind === 'service' ? services : products.filter((p) => p.active)).map((entry) => <option key={entry.id} value={entry.id}>{entry.name} — {formatCurrencyFromCents(entry.priceInCents)}</option>)}</select>
				<Button type='button' variant='outline' disabled={!selectedId} onClick={addItem}>Adicionar</Button>
			</div>
			{renderLines(serviceLines, 'service')}{renderLines(productLines, 'product')}
			<div className='text-right font-semibold'>Total: {total === null ? 'Valores inválidos' : formatCurrencyFromCents(total)}</div>
		</div>
		<DialogFooter><DialogClose asChild><Button variant='outline' type='button'>Cancelar</Button></DialogClose><Button type='button' disabled={action.isPending || total === null || serviceLines.length + productLines.length === 0} onClick={() => action.execute({ appointmentId: appointment.id, services: serviceLines, products: productLines })}>{action.isPending ? 'Salvando...' : 'Salvar itens'}</Button></DialogFooter>
	</DialogContent>;
}

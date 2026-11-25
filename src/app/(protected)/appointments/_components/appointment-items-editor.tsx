'use client';

import { updateAppointmentItems } from '@/api/actions/appointment-items.actions';
import type { AppointmentListItem } from '@/api/schema/appointments.schema';
import type { ServicesWithRelations } from '@/api/schema/services.schema';
import InputForm from '@/components/form/input-form';
import MoneyInputForm from '@/components/form/money-input-form';
import SelectForm from '@/components/form/select-form';
import { Button } from '@/components/ui/button';
import {
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrencyFromCents } from '@/helpers/currency';
import { filterServicesForSpecies, totalForItems } from '@/lib/appointments/appointment-items';
import { useAction } from 'next-safe-action/hooks';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

type Product = { id: string; name: string; priceInCents: number; active: boolean };
type Line = { id: string; quantity: number; unitPrice: number; discount: number };
type FormData = {
	kind: 'service' | 'product';
	selectedId: string;
	services: Line[];
	products: Line[];
};
const fromCents = (amount: number) => amount / 100;
const toCents = (amount: number) => Math.round(amount * 100);

export default function AppointmentItemsEditor({
	appointment,
	specieId,
	services,
	products,
	onSuccess,
}: {
	appointment: AppointmentListItem;
	specieId: string | undefined;
	services: ServicesWithRelations[];
	products: Product[];
	onSuccess?: () => void;
}) {
	const form = useForm<FormData>({
		defaultValues: {
			kind: 'service',
			selectedId: '',
			services: appointment.items.map((item) => ({
				id: item.serviceId,
				quantity: item.quantity,
				unitPrice: fromCents(item.priceAtTimeInCents),
				discount: fromCents(item.discountInCents),
			})),
			products: (appointment.productItems ?? []).map((item) => ({
				id: item.productId,
				quantity: item.quantity,
				unitPrice: fromCents(item.priceAtTimeInCents),
				discount: fromCents(item.discountInCents),
			})),
		},
	});
	const kind = useWatch({ control: form.control, name: 'kind' });
	const selectedId = useWatch({ control: form.control, name: 'selectedId' });
	const serviceLines = useWatch({ control: form.control, name: 'services' }) ?? [];
	const productLines = useWatch({ control: form.control, name: 'products' }) ?? [];
	const catalogue =
		kind === 'service'
			? filterServicesForSpecies(services, specieId)
			: products.filter((product) => product.active);

	const action = useAction(updateAppointmentItems, {
		onSuccess: () => {
			toast.success('Itens do atendimento atualizados');
			onSuccess?.();
		},
		onError: ({ error }) => toast.error(error.serverError ?? 'Não foi possível atualizar os itens.'),
	});

	const addItem = () => {
		const record = catalogue.find((item) => item.id === selectedId);
		if (!record) return;
		const path = kind === 'service' ? 'services' : 'products';
		const lines = kind === 'service' ? serviceLines : productLines;
		if (lines.some((line) => line.id === record.id)) {
			toast.error('Item já adicionado. Ajuste a quantidade.');
			return;
		}
		form.setValue(
			path,
			[
				...lines,
				{
					id: record.id,
					quantity: 1,
					unitPrice: fromCents(record.priceInCents),
					discount: 0,
				},
			],
			{ shouldDirty: true },
		);
		form.setValue('selectedId', '');
	};
	const removeLine = (kindToRemove: 'service' | 'product', index: number) => {
		const path = kindToRemove === 'service' ? 'services' : 'products';
		const lines = kindToRemove === 'service' ? serviceLines : productLines;
		form.setValue(
			path,
			lines.filter((_, i) => i !== index),
			{ shouldDirty: true },
		);
	};
	const toPayload = (lines: Line[]) =>
		lines.map((line) => ({
			id: line.id,
			quantity: line.quantity,
			unitPriceInCents: toCents(line.unitPrice),
			discountInCents: toCents(line.discount),
		}));
	let total: number | null = null;
	try {
		if (
			[...serviceLines, ...productLines].some(
				(line) =>
					!Number.isFinite(line.unitPrice) ||
					!Number.isFinite(line.discount) ||
					!Number.isInteger(line.quantity),
			)
		) {
			throw new Error('Valores inválidos');
		}
		total = totalForItems([...toPayload(serviceLines), ...toPayload(productLines)]);
	} catch {
		total = null;
	}

	const renderLines = (lines: Line[], target: 'service' | 'product') =>
		lines.map((line, index) => {
			const name =
				target === 'service'
					? (services.find((service) => service.id === line.id)?.name ?? 'Serviço')
					: (products.find((product) => product.id === line.id)?.name ?? 'Produto');
			return (
				<div key={`${target}-${line.id}`} className='space-y-2 rounded-md border p-3'>
					<div className='flex min-w-0 items-center justify-between gap-2'>
						<strong className='min-w-0 break-words text-sm'>{name}</strong>
						<Button type='button' size='sm' variant='outline' onClick={() => removeLine(target, index)}>
							Remover
						</Button>
					</div>
					<div className='grid min-w-0 gap-2 sm:grid-cols-3'>
						<InputForm<FormData>
							label='Quantidade'
							name={`${target === 'service' ? 'services' : 'products'}.${index}.quantity`}
							register={form.register}
							registerOptions={{ valueAsNumber: true, min: 1, max: 999 }}
							type='number'
							min={1}
							max={999}
						/>
						<MoneyInputForm<FormData>
							label='Preço unitário'
							name={`${target === 'service' ? 'services' : 'products'}.${index}.unitPrice`}
							control={form.control}
						/>
						<MoneyInputForm<FormData>
							label='Desconto'
							name={`${target === 'service' ? 'services' : 'products'}.${index}.discount`}
							control={form.control}
						/>
					</div>
				</div>
			);
		});

	return (
		<DialogContent className='max-h-[95dvh] w-[calc(100vw-1.5rem)] max-w-3xl overflow-y-auto'>
			<DialogHeader>
				<DialogTitle>Itens do atendimento</DialogTitle>
				<DialogDescription>
					{appointment.pet.name} — valores históricos, quantidade e descontos. Vacinas já vinculadas ao
					prontuário não podem ser removidas.
				</DialogDescription>
			</DialogHeader>
			<div className='space-y-4'>
				<div className='grid min-w-0 gap-2 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] sm:items-end'>
					<SelectForm<FormData>
						label='Tipo de item'
						name='kind'
						control={form.control}
						options={[
							{ value: 'service', label: 'Serviço' },
							{ value: 'product', label: 'Produto' },
						]}
						onSelect={() => form.setValue('selectedId', '')}
					/>
					<SelectForm<FormData>
						label='Item do catálogo'
						name='selectedId'
						control={form.control}
						placeholder='Selecione um item'
						options={catalogue.map((item) => ({
							value: item.id,
							label: `${item.name} — ${formatCurrencyFromCents(item.priceInCents)}`,
						}))}
					/>
					<Button
						type='button'
						variant='outline'
						disabled={!catalogue.some((item) => item.id === selectedId)}
						onClick={addItem}
					>
						Adicionar
					</Button>
				</div>
				{renderLines(serviceLines, 'service')}
				{renderLines(productLines, 'product')}
				<div className='text-right font-semibold' aria-live='polite'>
					Total: {total === null ? 'Valores inválidos' : formatCurrencyFromCents(total)}
				</div>
			</div>
			<DialogFooter>
				<DialogClose asChild>
					<Button variant='outline' type='button'>
						Cancelar
					</Button>
				</DialogClose>
				<Button
					type='button'
					disabled={action.isPending || total === null || serviceLines.length + productLines.length === 0}
					onClick={() => {
						void form.handleSubmit((data) =>
							action.execute({
								appointmentId: appointment.id,
								services: toPayload(data.services),
								products: toPayload(data.products),
							}),
						)();
					}}
				>
					{action.isPending ? 'Salvando...' : 'Salvar itens'}
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}

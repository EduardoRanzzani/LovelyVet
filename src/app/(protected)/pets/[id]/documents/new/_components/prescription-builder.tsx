'use client';

import { getPrescriptionsItems } from '@/api/actions/prescriptions-items.actions';
import type { PrescriptionItemsWithRelations } from '@/api/schema/prescriptions-items.schema';
import TextEditorForm from '@/components/form/text-editor-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

export interface PrescriptionDraftItem {
	sourceId: string | null;
	name: string;
	pharmacy: string;
	quantity: string;
	orientations: string;
}

interface PrescriptionDraft {
	administrationRoute: string;
	items: PrescriptionDraftItem[];
}

interface PrescriptionBuilderProps {
	initialItems?: PrescriptionDraftItem[];
	initialAdministrationRoute?: string;
	onItemsChange?: (items: PrescriptionDraftItem[]) => void;
	onAdministrationRouteChange?: (value: string) => void;
}

export default function PrescriptionBuilder({
	initialItems = [],
	initialAdministrationRoute = '',
	onItemsChange,
	onAdministrationRouteChange,
}: PrescriptionBuilderProps) {
	const [catalog, setCatalog] = useState<PrescriptionItemsWithRelations[]>([]);
	const [selectedCatalogItem, setSelectedCatalogItem] = useState<string>('');
	const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

	const form = useForm<PrescriptionDraft>({
		defaultValues: {
			administrationRoute: initialAdministrationRoute,
			items: initialItems,
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'items',
	});

	const items = useWatch({
		control: form.control,
		name: 'items',
	});

	const administrationRoute = useWatch({
		control: form.control,
		name: 'administrationRoute',
	});

	useEffect(() => {
		onItemsChange?.(items ?? []);
	}, [items, onItemsChange]);

	useEffect(() => {
		onAdministrationRouteChange?.(administrationRoute ?? '');
	}, [administrationRoute, onAdministrationRouteChange]);

	useEffect(() => {
		const loadCatalog = async () => {
			try {
				const data = await getPrescriptionsItems();
				setCatalog(data);
			} catch (error) {
				console.error(error);
				toast.error('Não foi possível carregar os medicamentos.');
			} finally {
				setIsLoadingCatalog(false);
			}
		};

		void loadCatalog();
	}, []);

	const handleAddFromCatalog = () => {
		if (!selectedCatalogItem) {
			return;
		}

		const item = catalog.find((item) => item.id === selectedCatalogItem);

		if (!item) {
			return;
		}

		append({
			sourceId: item.id,
			name: item.name,
			pharmacy: item.pharmacy,
			quantity: item.quantity,
			orientations: item.orientations,
		});

		setSelectedCatalogItem('');
	};

	const handleAddBlank = () => {
		append({
			sourceId: null,
			name: '',
			pharmacy: 'Farm. veterinária',
			quantity: '',
			orientations: '',
		});
	};

	return (
		<div className='space-y-6'>
			<div className='rounded-lg border bg-muted/30 p-4'>
				<div className='flex flex-col lg:flex-row gap-4 mb-4'>
					<div className='flex-1 space-y-2'>
						<Label>Via de administração</Label>
						<Input
							{...form.register('administrationRoute')}
							placeholder='Ex.: USO ORAL, USO TÓPICO, USO OTOLÓGICO...'
						/>
					</div>
					<div className='flex-1 space-y-2'>
						<Label>Adicionar do catálogo</Label>
						<Select
							value={selectedCatalogItem}
							onValueChange={setSelectedCatalogItem}
							disabled={isLoadingCatalog}
						>
							<SelectTrigger className='w-full'>
								<SelectValue
									placeholder={
										isLoadingCatalog
											? 'Carregando medicamentos...'
											: 'Selecione um medicamento'
									}
								/>
							</SelectTrigger>

							<SelectContent>
								{catalog.map((item) => (
									<SelectItem key={item.id} value={item.id}>
										{item.name} · {item.quantity}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<div className='flex flex-col gap-3 lg:flex-row lg:items-end'>
					<Button
						type='button'
						onClick={handleAddFromCatalog}
						disabled={!selectedCatalogItem}
						className={'w-full lg:flex-1'}
					>
						<PlusIcon className='size-4' />
						Adicionar
					</Button>

					<Button
						type='button'
						variant='outline'
						onClick={handleAddBlank}
						className={'w-full lg:flex-1'}
					>
						<PlusIcon className='size-4' />
						Medicamento avulso
					</Button>
				</div>
			</div>

			{fields.length === 0 ? (
				<div className='flex min-h-52 items-center justify-center rounded-lg border border-dashed'>
					<div className='text-center'>
						<p className='font-medium'>Nenhum medicamento adicionado</p>

						<p className='mt-1 text-sm text-muted-foreground'>
							Selecione um item do catálogo ou adicione um medicamento avulso.
						</p>
					</div>
				</div>
			) : (
				<div className='space-y-4'>
					{fields.map((field, index) => (
						<div key={field.id} className='rounded-xl border bg-card p-5'>
							<div className='mb-5 flex items-center justify-between'>
								<div>
									<p className='font-semibold'>Medicamento {index + 1}</p>

									<p className='text-xs text-muted-foreground'>
										Edite as informações que serão impressas.
									</p>
								</div>

								<Button
									type='button'
									size='icon'
									variant='ghost'
									onClick={() => remove(index)}
								>
									<Trash2Icon className='size-4 text-destructive' />
								</Button>
							</div>

							<div className='grid gap-4 md:grid-cols-3'>
								<div className='space-y-2 md:col-span-1'>
									<Label>Medicamento</Label>

									<Input
										{...form.register(`items.${index}.name`)}
										placeholder='Nome do medicamento'
									/>
								</div>

								<div className='space-y-2'>
									<Label>Farmácia</Label>

									<Input
										{...form.register(`items.${index}.pharmacy`)}
										placeholder='Farm. veterinária'
									/>
								</div>

								<div className='space-y-2'>
									<Label>Quantidade</Label>

									<Input
										{...form.register(`items.${index}.quantity`)}
										placeholder='Ex.: 1 cx.'
									/>
								</div>
							</div>

							<div className='mt-4'>
								<TextEditorForm
									name={`items.${index}.orientations`}
									control={form.control}
									label='Orientações'
									placeholder='Administrar...'
								/>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

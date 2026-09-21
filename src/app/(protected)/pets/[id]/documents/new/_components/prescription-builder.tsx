'use client';

import { getPrescriptionsItems } from '@/api/actions/prescriptions-items.actions';
import type { PrescriptionItemsWithRelations } from '@/api/schema/prescriptions-items.schema';
import TextEditorForm from '@/components/form/text-editor-form';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
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
import {
	type Control,
	type UseFormRegister,
	useFieldArray,
	useForm,
	useWatch,
} from 'react-hook-form';
import { toast } from 'sonner';

export interface PrescriptionDraftItem {
	sourceId: string | null;
	name: string;
	pharmacy: string;
	quantity: string;
	orientations: string;
}

export interface PrescriptionDraftGroup {
	administrationRoute: string;
	items: PrescriptionDraftItem[];
}

interface PrescriptionDraft {
	groups: PrescriptionDraftGroup[];
}

interface PrescriptionBuilderProps {
	initialGroups?: PrescriptionDraftGroup[];
	onGroupsChange?: (groups: PrescriptionDraftGroup[]) => void;
}

export default function PrescriptionBuilder({
	initialGroups = [],
	onGroupsChange,
}: PrescriptionBuilderProps) {
	const [catalog, setCatalog] = useState<PrescriptionItemsWithRelations[]>([]);

	const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

	const form = useForm<PrescriptionDraft>({
		defaultValues: {
			groups:
				initialGroups.length > 0
					? initialGroups
					: [
							{
								administrationRoute: '',
								items: [],
							},
						],
		},
	});

	const {
		fields: groupFields,
		append: appendGroup,
		remove: removeGroup,
	} = useFieldArray({
		control: form.control,
		name: 'groups',
	});

	const groups = useWatch({
		control: form.control,
		name: 'groups',
	});

	useEffect(() => {
		onGroupsChange?.(groups ?? []);
	}, [groups, onGroupsChange]);

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

	const handleAddGroup = () => {
		appendGroup({
			administrationRoute: '',
			items: [],
		});
	};

	return (
		<div className='space-y-6'>
			<div className='space-y-5'>
				{groupFields.map((groupField, groupIndex) => (
					<PrescriptionGroupEditor
						key={groupField.id}
						groupIndex={groupIndex}
						control={form.control}
						register={form.register}
						catalog={catalog}
						isLoadingCatalog={isLoadingCatalog}
						canRemove={groupFields.length > 1}
						onRemove={() => removeGroup(groupIndex)}
					/>
				))}
			</div>

			<Button
				type='button'
				variant='outline'
				onClick={handleAddGroup}
				className='w-full'
			>
				<PlusIcon className='size-4' />
				Adicionar modo de uso
			</Button>
		</div>
	);
}

interface PrescriptionGroupEditorProps {
	groupIndex: number;
	control: Control<PrescriptionDraft>;
	register: UseFormRegister<PrescriptionDraft>;
	catalog: PrescriptionItemsWithRelations[];
	isLoadingCatalog: boolean;
	canRemove: boolean;
	onRemove: () => void;
}

function PrescriptionGroupEditor({
	groupIndex,
	control,
	register,
	catalog,
	isLoadingCatalog,
	canRemove,
	onRemove,
}: PrescriptionGroupEditorProps) {
	const [selectedCatalogItem, setSelectedCatalogItem] = useState('');

	const { fields, append, remove } = useFieldArray({
		control,
		name: `groups.${groupIndex}.items` as const,
	});

	const items = useWatch({
		control,
		name: `groups.${groupIndex}.items` as const,
	});

	const administrationRoute = useWatch({
		control,
		name: `groups.${groupIndex}.administrationRoute` as const,
	});

	const handleAddFromCatalog = () => {
		if (!selectedCatalogItem) {
			return;
		}

		const item = catalog.find(
			(catalogItem) => catalogItem.id === selectedCatalogItem,
		);

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
		<section className='rounded-xl border bg-card p-3 sm:p-5'>
			<div className='mb-5 flex items-start justify-between gap-3'>
				<div className='min-w-0'>
					<h4 className='font-semibold'>Modo de uso {groupIndex + 1}</h4>

					<p className='truncate text-sm text-muted-foreground'>
						{administrationRoute?.trim() || 'Informe a via de administração'}
					</p>
				</div>

				{canRemove && (
					<Button
						type='button'
						variant='ghost'
						size='sm'
						onClick={onRemove}
						className='shrink-0 text-destructive hover:text-destructive'
					>
						<Trash2Icon className='size-4' />
						Remover bloco
					</Button>
				)}
			</div>

			<div className='mb-4 grid gap-4 lg:grid-cols-2'>
				<div className='space-y-2'>
					<Label>Via de administração</Label>

					<Input
						{...register(`groups.${groupIndex}.administrationRoute` as const)}
						placeholder='Ex.: USO ORAL, USO TÓPICO, USO OTOLÓGICO...'
					/>
				</div>

				<div className='space-y-2'>
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

			<div className='mb-5 flex flex-col gap-3 lg:flex-row lg:items-end'>
				<Button
					type='button'
					onClick={handleAddFromCatalog}
					disabled={!selectedCatalogItem}
					className='w-full lg:flex-1'
				>
					<PlusIcon className='size-4' />
					Adicionar
				</Button>

				<Button
					type='button'
					variant='outline'
					onClick={handleAddBlank}
					className='w-full lg:flex-1'
				>
					<PlusIcon className='size-4' />
					Medicamento avulso
				</Button>
			</div>

			{fields.length === 0 ? (
				<div className='flex min-h-32 items-center justify-center rounded-lg border border-dashed'>
					<div className='text-center'>
						<p className='font-medium'>Nenhum medicamento neste bloco</p>

						<p className='mt-1 text-sm text-muted-foreground'>
							Adicione um medicamento para{' '}
							{administrationRoute?.trim() || 'este modo de uso'}.
						</p>
					</div>
				</div>
			) : (
				<Accordion
					key={fields.map((field) => field.id).join('|')}
					type='multiple'
					defaultValue={fields.map((field) => field.id)}
					className='space-y-3'
				>
					{fields.map((field, itemIndex) => (
						<AccordionItem
							key={field.id}
							value={field.id}
							className='rounded-xl border bg-card px-3 last:border-b sm:px-5'
						>
							<div className='flex min-w-0 items-center gap-2'>
								<AccordionTrigger className='min-w-0 flex-1 py-3 hover:no-underline sm:py-4'>
									<div className='flex min-w-0 flex-1 flex-col text-left'>
										<span className='truncate font-semibold'>
											Medicamento {itemIndex + 1}
											{items?.[itemIndex]?.name
												? ` · ${items[itemIndex].name}`
												: ''}
										</span>

										<span className='truncate text-xs font-normal text-muted-foreground'>
											{[
												items?.[itemIndex]?.pharmacy,

												items?.[itemIndex]?.quantity,
											]
												.filter(Boolean)
												.join(' · ') || 'Toque para preencher os dados'}
										</span>
									</div>
								</AccordionTrigger>

								<Button
									type='button'
									size='icon'
									variant='outline'
									onClick={() => remove(itemIndex)}
									aria-label={`Excluir medicamento ${itemIndex + 1}`}
									className='shrink-0'
								>
									<Trash2Icon className='size-4 text-destructive' />
								</Button>
							</div>

							<AccordionContent className='border-t pt-4'>
								<div className='grid gap-4 md:grid-cols-3'>
									<div className='space-y-2'>
										<Label>Medicamento</Label>

										<Input
											{...register(
												`groups.${groupIndex}.items.${itemIndex}.name` as const,
											)}
											placeholder='Nome do medicamento'
										/>
									</div>

									<div className='space-y-2'>
										<Label>Farmácia</Label>

										<Input
											{...register(
												`groups.${groupIndex}.items.${itemIndex}.pharmacy` as const,
											)}
											placeholder='Farm. veterinária'
										/>
									</div>

									<div className='space-y-2'>
										<Label>Quantidade</Label>

										<Input
											{...register(
												`groups.${groupIndex}.items.${itemIndex}.quantity` as const,
											)}
											placeholder='Ex.: 1 cx.'
										/>
									</div>
								</div>

								<div className='mt-4'>
									<TextEditorForm
										name={
											`groups.${groupIndex}.items.${itemIndex}.orientations` as const
										}
										control={control}
										label='Orientações'
										placeholder='Administrar...'
									/>
								</div>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			)}
		</section>
	);
}

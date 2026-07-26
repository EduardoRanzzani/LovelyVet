'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import {
	Control,
	Controller,
	FieldValues,
	Path,
	PathValue,
} from 'react-hook-form';

interface SelectOption {
	key?: string;
	value: string | number | boolean;
	label: string;
}

interface SelectFormProps<T extends FieldValues> {
	label: string;
	error?: string;
	options: SelectOption[];
	name: Path<T>;
	control: Control<T>;
	required?: boolean;
	className?: string;
	placeholder?: string;
	multiple?: boolean;
	maxVisible?: number;
	onSelect?: (
		value: string | number | boolean | (string | number | boolean)[],
	) => void;
}

const SelectForm = <T extends FieldValues>({
	label,
	error,
	options,
	name,
	control,
	required,
	className,
	placeholder = 'Selecione...',
	multiple = false,
	maxVisible = 2,
	onSelect,
}: SelectFormProps<T>) => {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');
	const [activeIndex, setActiveIndex] = useState<number>(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const listboxRef = useRef<HTMLDivElement>(null);
	const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

	const uid = useId();
	const listboxId = `${uid}-listbox`;
	const labelId = `${uid}-label`;
	const errorId = `${uid}-error`;

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Ao abrir, foca a busca e reseta o índice ativo
	useEffect(() => {
		if (open) {
			requestAnimationFrame(() => searchInputRef.current?.focus());
		}
	}, [open]);

	// Mantém a opção ativa visível ao navegar
	useEffect(() => {
		if (open && activeIndex >= 0) {
			optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
		}
	}, [activeIndex, open]);

	// Abre a lista já definindo o índice ativo inicial
	const openList = () => {
		setOpen(true);
		setActiveIndex(0);
	};

	// Fecha a lista já limpando busca e índice ativo
	const closeList = (refocusTrigger = true) => {
		setOpen(false);
		setSearch('');
		setActiveIndex(-1);
		if (refocusTrigger) triggerRef.current?.focus();
	};

	const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
		if (
			e.key === 'Enter' ||
			e.key === ' ' ||
			e.key === 'ArrowDown' ||
			e.key === 'ArrowUp'
		) {
			e.preventDefault();
			openList();
		}
	};

	return (
		<Controller
			name={name}
			control={control}
			render={({ field }) => {
				const values: (string | number | boolean)[] = multiple
					? Array.isArray(field.value)
						? field.value
						: []
					: field.value !== undefined &&
						  field.value !== null &&
						  field.value !== ''
						? [field.value as string | number | boolean]
						: [];

				const selectedOptions = options.filter((o) => values.includes(o.value));

				const filteredOptions = options.filter((opt) =>
					opt.label.toLowerCase().includes(search.toLowerCase()),
				);

				const handleSelect = (value: string | number | boolean) => {
					let newValue: PathValue<T, Path<T>>;

					if (multiple) {
						const currentValues = (
							Array.isArray(field.value) ? field.value : []
						) as (string | number | boolean)[];
						const updatedArray = currentValues.includes(value)
							? currentValues.filter((v) => v !== value)
							: [...currentValues, value];
						newValue = updatedArray as PathValue<T, Path<T>>;
					} else {
						newValue = value as PathValue<T, Path<T>>;
						closeList();
					}

					field.onChange(newValue);
					onSelect?.(
						newValue as
							| string
							| number
							| boolean
							| (string | number | boolean)[],
					);
				};

				const handleListKeyDown = (e: React.KeyboardEvent) => {
					if (
						filteredOptions.length === 0 &&
						e.key !== 'Escape' &&
						e.key !== 'Tab'
					) {
						return;
					}

					switch (e.key) {
						case 'ArrowDown':
							e.preventDefault();
							setActiveIndex((prev) =>
								prev < filteredOptions.length - 1 ? prev + 1 : 0,
							);
							break;
						case 'ArrowUp':
							e.preventDefault();
							setActiveIndex((prev) =>
								prev > 0 ? prev - 1 : filteredOptions.length - 1,
							);
							break;
						case 'Home':
							e.preventDefault();
							setActiveIndex(0);
							break;
						case 'End':
							e.preventDefault();
							setActiveIndex(filteredOptions.length - 1);
							break;
						case 'Enter':
							e.preventDefault();
							if (activeIndex >= 0 && filteredOptions[activeIndex]) {
								handleSelect(filteredOptions[activeIndex].value);
							}
							break;
						case ' ':
							// Evita interferir na digitação da busca; só seleciona se o foco
							// não estiver no input de texto (caso raro, mas seguro por padrão)
							if (document.activeElement !== searchInputRef.current) {
								e.preventDefault();
								if (activeIndex >= 0 && filteredOptions[activeIndex]) {
									handleSelect(filteredOptions[activeIndex].value);
								}
							}
							break;
						case 'Escape':
							e.preventDefault();
							closeList();
							break;
						case 'Tab':
							closeList(false);
							break;
						default:
							break;
					}
				};

				return (
					<div
						className={cn('flex flex-col relative w-full', className)}
						ref={containerRef}
					>
						<label id={labelId} className='mb-1 text-xs font-medium'>
							{label} {required && <span className='text-red-500'>*</span>}
						</label>

						<div
							ref={triggerRef}
							role='combobox'
							tabIndex={0}
							aria-haspopup='listbox'
							aria-expanded={open}
							aria-controls={listboxId}
							aria-labelledby={labelId}
							aria-required={required}
							aria-invalid={!!error}
							aria-describedby={error ? errorId : undefined}
							onKeyDown={handleTriggerKeyDown}
							className={cn(
								'border-input h-7 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-all outline-none',
								'flex items-center justify-between cursor-pointer gap-2',
								'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
								error ? 'border-destructive' : 'focus-visible:border-ring',
								className,
							)}
							onClick={() => setOpen((prev) => !prev)}
						>
							<div className='flex items-center flex-1 min-w-0 gap-1 overflow-hidden'>
								{selectedOptions.length > 0 ? (
									multiple ? (
										/* RENDERIZAÇÃO MULTIPLE: BADGES */
										<>
											<div className='flex items-center gap-1 overflow-hidden flex-nowrap'>
												{selectedOptions.slice(0, maxVisible).map((opt) => (
													<span
														key={opt.key || opt.value.toString()}
														className='bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-2 py-0.5 rounded-sm text-[11px] font-medium flex items-center shrink-0 border border-zinc-200 dark:border-zinc-700 whitespace-nowrap max-w-30'
													>
														<span className='truncate'>{opt.label}</span>
														<X
															className='w-3 h-3 ml-1 cursor-pointer hover:text-destructive'
															role='button'
															aria-label={`Remover ${opt.label}`}
															tabIndex={0}
															onClick={(e) => {
																e.stopPropagation();
																handleSelect(opt.value);
															}}
															onKeyDown={(e) => {
																if (e.key === 'Enter' || e.key === ' ') {
																	e.preventDefault();
																	e.stopPropagation();
																	handleSelect(opt.value);
																}
															}}
														/>
													</span>
												))}
											</div>
											{selectedOptions.length > maxVisible && (
												<span className='text-[10px] font-bold text-muted-foreground bg-zinc-50 dark:bg-zinc-900 px-1.5 py-0.5 rounded border shrink-0'>
													+{selectedOptions.length - maxVisible}
												</span>
											)}
										</>
									) : (
										/* RENDERIZAÇÃO SINGLE: TEXTO PURO */
										<span className='truncate text-zinc-900 dark:text-zinc-100'>
											{selectedOptions[0].label}
										</span>
									)
								) : (
									<span className='truncate text-zinc-400'>{placeholder}</span>
								)}
							</div>

							<div className='flex items-center opacity-50 shrink-0'>
								{open ? (
									<ChevronUp className='w-4 h-4' aria-hidden='true' />
								) : (
									<ChevronDown className='w-4 h-4' aria-hidden='true' />
								)}
							</div>
						</div>

						{/* LISTBOX / DROPDOWN */}
						{open && (
							<div
								className='absolute left-0 right-0 z-1 flex flex-col w-full mt-1 overflow-hidden bg-white border rounded-md shadow-lg border-zinc-300 dark:bg-zinc-950 dark:border-zinc-800 max-h-60'
								style={{ top: '100%' }}
							>
								<div className='p-2 border-b border-zinc-100 dark:border-zinc-800'>
									<Input
										ref={searchInputRef}
										type='text'
										role='searchbox'
										aria-label='Pesquisar opções'
										aria-controls={listboxId}
										aria-activedescendant={
											activeIndex >= 0 && filteredOptions[activeIndex]
												? `${listboxId}-option-${activeIndex}`
												: undefined
										}
										value={search}
										onChange={(e) => {
											setSearch(e.target.value);
											setActiveIndex(0);
										}}
										placeholder='Pesquisar...'
										className='h-8 focus-visible:ring-1'
										onKeyDown={handleListKeyDown}
									/>
								</div>

								<div
									ref={listboxRef}
									id={listboxId}
									role='listbox'
									aria-multiselectable={multiple}
									aria-labelledby={labelId}
									className='flex-1 overflow-y-auto'
								>
									{filteredOptions.map((opt, index) => {
										const isSelected = values.includes(opt.value);
										const isActive = index === activeIndex;
										return (
											<div
												key={opt.key || opt.value.toString()}
												id={`${listboxId}-option-${index}`}
												role='option'
												aria-selected={isSelected}
												ref={(el) => {
													optionRefs.current[index] = el;
												}}
												className={cn(
													'px-3 py-2 text-sm cursor-pointer transition flex items-center gap-2 outline-none',
													'hover:bg-zinc-100 dark:hover:bg-zinc-800',
													isActive && 'bg-zinc-100 dark:bg-zinc-800',
													isSelected &&
														'bg-zinc-50 dark:bg-zinc-900 font-medium',
												)}
												onMouseEnter={() => setActiveIndex(index)}
												onClick={(e) => {
													e.stopPropagation();
													handleSelect(opt.value);
												}}
											>
												{multiple && (
													<input
														type='checkbox'
														checked={isSelected}
														readOnly
														tabIndex={-1}
														aria-hidden='true'
														className='w-4 h-4 rounded border-zinc-300 accent-primary'
													/>
												)}
												<span className='truncate'>{opt.label}</span>
											</div>
										);
									})}
									{filteredOptions.length === 0 && (
										<div
											role='status'
											className='px-3 py-4 text-sm text-center text-zinc-400'
										>
											Nenhum resultado encontrado
										</div>
									)}
								</div>
							</div>
						)}
						{error && (
							<p
								id={errorId}
								role='alert'
								className='mt-1 text-xs text-destructive'
							>
								{error}
							</p>
						)}
					</div>
				);
			}}
		/>
	);
};

export default SelectForm;

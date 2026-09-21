'use client';

import { Input } from '@/components/ui/input';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
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

	const triggerRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

	const uid = useId();
	const listboxId = `${uid}-listbox`;
	const labelId = `${uid}-label`;
	const errorId = `${uid}-error`;

	// Mantém a opção ativa visível durante navegação pelo teclado.
	// Não há setState aqui, então continua compatível com as regras
	// mais rígidas do React 19.
	useEffect(() => {
		if (open && activeIndex >= 0) {
			optionRefs.current[activeIndex]?.scrollIntoView({
				block: 'nearest',
			});
		}
	}, [activeIndex, open]);

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);

		if (nextOpen) {
			setActiveIndex(0);
			return;
		}

		setSearch('');
		setActiveIndex(-1);
	};

	const closeList = (refocusTrigger = true) => {
		handleOpenChange(false);

		if (refocusTrigger) {
			requestAnimationFrame(() => {
				triggerRef.current?.focus();
			});
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

				const selectedOptions = options.filter((option) =>
					values.includes(option.value),
				);

				const filteredOptions = options.filter((option) =>
					option.label.toLowerCase().includes(search.toLowerCase()),
				);

				const handleSelect = (value: string | number | boolean) => {
					let newValue: PathValue<T, Path<T>>;

					if (multiple) {
						const currentValues = (
							Array.isArray(field.value) ? field.value : []
						) as (string | number | boolean)[];

						const updatedArray = currentValues.includes(value)
							? currentValues.filter((currentValue) => currentValue !== value)
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

							setActiveIndex((previous) =>
								previous < filteredOptions.length - 1 ? previous + 1 : 0,
							);

							break;

						case 'ArrowUp':
							e.preventDefault();

							setActiveIndex((previous) =>
								previous > 0 ? previous - 1 : filteredOptions.length - 1,
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
							handleOpenChange(false);
							break;

						default:
							break;
					}
				};

				const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
					if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') {
						return;
					}

					e.preventDefault();

					if (!open) {
						handleOpenChange(true);
					}
				};

				return (
					<div
						className={cn('flex w-full min-w-0 max-w-full flex-col', className)}
					>
						<label id={labelId} className='mb-1 text-xs font-medium'>
							{label}

							{required && <span className='text-red-500'>*</span>}
						</label>

						<Popover open={open} onOpenChange={handleOpenChange} modal={false}>
							<PopoverTrigger asChild>
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
										'border-input flex h-9 w-full min-w-0 max-w-full cursor-pointer items-center justify-between gap-2 overflow-hidden rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-all outline-none',
										'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
										error ? 'border-destructive' : 'focus-visible:border-ring',
									)}
								>
									<div className='flex min-w-0 flex-1 items-center gap-1 overflow-hidden'>
										{selectedOptions.length > 0 ? (
											multiple ? (
												<>
													<div className='flex min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-hidden'>
														{selectedOptions
															.slice(0, maxVisible)
															.map((option) => (
																<span
																	key={option.key || option.value.toString()}
																	className='flex max-w-30 shrink-0 items-center whitespace-nowrap rounded-sm border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100'
																>
																	<span className='truncate'>
																		{option.label}
																	</span>

																	<X
																		className='ml-1 h-3 w-3 cursor-pointer hover:text-destructive'
																		role='button'
																		aria-label={`Remover ${option.label}`}
																		tabIndex={0}
																		onClick={(e) => {
																			e.preventDefault();
																			e.stopPropagation();

																			handleSelect(option.value);
																		}}
																		onKeyDown={(e) => {
																			if (e.key === 'Enter' || e.key === ' ') {
																				e.preventDefault();
																				e.stopPropagation();

																				handleSelect(option.value);
																			}
																		}}
																	/>
																</span>
															))}
													</div>

													{selectedOptions.length > maxVisible && (
														<span className='shrink-0 rounded border bg-zinc-50 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground dark:bg-zinc-900'>
															+{selectedOptions.length - maxVisible}
														</span>
													)}
												</>
											) : (
												<span className='block min-w-0 flex-1 truncate text-zinc-900 dark:text-zinc-100'>
													{selectedOptions[0].label}
												</span>
											)
										) : (
											<span className='truncate text-zinc-400'>
												{placeholder}
											</span>
										)}
									</div>

									<div className='flex shrink-0 items-center opacity-50'>
										{open ? (
											<ChevronUp className='h-4 w-4' aria-hidden='true' />
										) : (
											<ChevronDown className='h-4 w-4' aria-hidden='true' />
										)}
									</div>
								</div>
							</PopoverTrigger>

							<PopoverContent
								align='start'
								sideOffset={4}
								collisionPadding={8}
								className='z-100 w-(--radix-popover-trigger-width) min-w-0 overflow-hidden p-0'
								onOpenAutoFocus={(e) => {
									e.preventDefault();

									requestAnimationFrame(() => {
										searchInputRef.current?.focus();
									});
								}}
							>
								<div className='shrink-0 border-b border-zinc-100 p-2 dark:border-zinc-800'>
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
									id={listboxId}
									role='listbox'
									aria-multiselectable={multiple}
									aria-labelledby={labelId}
									className='max-h-60 overflow-y-auto overscroll-contain'
								>
									{filteredOptions.map((option, index) => {
										const isSelected = values.includes(option.value);
										const isActive = index === activeIndex;

										return (
											<div
												key={option.key || option.value.toString()}
												id={`${listboxId}-option-${index}`}
												role='option'
												aria-selected={isSelected}
												ref={(element) => {
													optionRefs.current[index] = element;
												}}
												className={cn(
													'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm outline-none transition',
													'hover:bg-zinc-100 dark:hover:bg-zinc-800',
													isActive && 'bg-zinc-100 dark:bg-zinc-800',
													isSelected &&
														'bg-zinc-50 font-medium dark:bg-zinc-900',
												)}
												onMouseEnter={() => setActiveIndex(index)}
												onClick={(e) => {
													e.stopPropagation();
													handleSelect(option.value);
												}}
											>
												{multiple && (
													<input
														type='checkbox'
														checked={isSelected}
														readOnly
														tabIndex={-1}
														aria-hidden='true'
														className='h-4 w-4 rounded border-zinc-300 accent-primary'
													/>
												)}

												<span className='min-w-0 flex-1 truncate'>
													{option.label}
												</span>
											</div>
										);
									})}

									{filteredOptions.length === 0 && (
										<div
											role='status'
											className='px-3 py-4 text-center text-sm text-zinc-400'
										>
											Nenhum resultado encontrado
										</div>
									)}
								</div>
							</PopoverContent>
						</Popover>

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

'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

interface DateTimePickerFormProps<T extends FieldValues> {
	label: string;
	error?: string;
	name: Path<T>;
	control: Control<T>;
	required?: boolean;
	disabled?: boolean;
	placeholder?: string;
	className?: string;
	availableTimes?: string[];
	availabilityLoading?: boolean;
	onDateChange?: (date: Date) => void;
	onOpenWithDate?: (date: Date | null) => void;
	onValueChange?: (date: Date) => void;
}

const DateTimePickerForm = <T extends FieldValues>({
	label,
	error,
	name,
	control,
	required,
	disabled,
	placeholder = 'Selecione data e hora',
	className,
	availableTimes,
	availabilityLoading = false,
	onDateChange,
	onOpenWithDate,
	onValueChange,
}: DateTimePickerFormProps<T>) => {
	const [isOpen, setIsOpen] = useState(false);

	const hours = Array.from({ length: 24 }, (_, i) =>
		i.toString().padStart(2, '0'),
	);

	const minutes = Array.from({ length: 12 }, (_, i) =>
		(i * 5).toString().padStart(2, '0'),
	);

	return (
		<div className={cn('flex min-w-0 flex-col gap-1', className)}>
			<Label className='text-xs font-medium'>
				{label} {required && <span className='text-destructive'>*</span>}
			</Label>

			<Controller
				name={name}
				control={control}
				render={({ field }) => {
					const fieldValue = field.value as unknown;

					const selectedDate = fieldValue instanceof Date ? fieldValue : null;

					const isTimeAvailable = (hour: string, minute: string) => {
						if (availableTimes === undefined) {
							return true;
						}

						return availableTimes.includes(`${hour}:${minute}`);
					};

					const hasAvailableTimeInHour = (hour: string) => {
						if (availableTimes === undefined) {
							return true;
						}

						return minutes.some((minute) => isTimeAvailable(hour, minute));
					};

					const selectedTimeIsAvailable =
						!selectedDate ||
						availableTimes === undefined ||
						isTimeAvailable(
							format(selectedDate, 'HH'),
							format(selectedDate, 'mm'),
						);

					const handleTimeChange = (
						type: 'hour' | 'minute',
						timeValue: string,
					) => {
						const baseDate = selectedDate || new Date();

						const newDate = new Date(baseDate);

						if (type === 'hour') {
							newDate.setHours(parseInt(timeValue, 10));

							const currentMinute = format(newDate, 'mm');

							if (
								availableTimes !== undefined &&
								!isTimeAvailable(timeValue, currentMinute)
							) {
								const firstAvailableMinute = minutes.find((minute) =>
									isTimeAvailable(timeValue, minute),
								);

								if (!firstAvailableMinute) {
									return;
								}

								newDate.setMinutes(parseInt(firstAvailableMinute, 10));
							}
						} else {
							const hour = format(newDate, 'HH');

							if (
								availableTimes !== undefined &&
								!isTimeAvailable(hour, timeValue)
							) {
								return;
							}

							newDate.setMinutes(parseInt(timeValue, 10));
						}

						field.onChange(newDate);
						onValueChange?.(newDate);
					};

					return (
						<Popover
							open={isOpen}
							onOpenChange={(open) => {
								setIsOpen(open);

								if (open) {
									onOpenWithDate?.(selectedDate);
								}
							}}
						>
							<PopoverTrigger asChild>
								<Button
									variant='outline'
									type='button'
									disabled={disabled}
									className={cn(
										'h-9 w-full min-w-0 justify-start overflow-hidden px-3 text-left font-normal',
										!selectedDate && 'text-muted-foreground',
										error && 'border-destructive',
									)}
								>
									<CalendarIcon className='mr-2 h-4 w-4' />

									{selectedDate ? (
										<span className='truncate'>
											{format(selectedDate, "dd/MM/yyyy 'às' HH:mm", {
												locale: ptBR,
											})}
										</span>
									) : (
										<span className='truncate'>{placeholder}</span>
									)}
								</Button>
							</PopoverTrigger>

							<PopoverContent
								className='flex w-auto max-w-[calc(100vw-1rem)] flex-col p-0'
								align='start'
							>
								<Calendar
									mode='single'
									selected={selectedDate || undefined}
									onSelect={(date: Date | undefined) => {
										if (!date) return;

										const newDate = new Date(date);

										if (selectedDate) {
											newDate.setHours(selectedDate.getHours());

											newDate.setMinutes(selectedDate.getMinutes());
										} else {
											newDate.setHours(9, 0, 0, 0);
										}

										field.onChange(newDate);

										onDateChange?.(newDate);

										onValueChange?.(newDate);
									}}
									locale={ptBR}
									initialFocus
								/>

								<div className='flex items-center justify-between gap-4 border-t border-border bg-muted/20 p-3'>
									<div className='flex w-full items-center gap-1'>
										<Select
											value={
												selectedDate ? format(selectedDate, 'HH') : undefined
											}
											disabled={disabled || availabilityLoading}
											onValueChange={(value) => handleTimeChange('hour', value)}
										>
											<SelectTrigger className='h-8 flex-1 text-xs'>
												<SelectValue placeholder='00' />
											</SelectTrigger>

											<SelectContent>
												{hours.map((hour) => (
													<SelectItem
														key={hour}
														value={hour}
														disabled={!hasAvailableTimeInHour(hour)}
													>
														{hour}h
													</SelectItem>
												))}
											</SelectContent>
										</Select>

										<span className='text-xs font-bold'>:</span>

										<Select
											value={
												selectedDate ? format(selectedDate, 'mm') : undefined
											}
											disabled={disabled || availabilityLoading}
											onValueChange={(value) =>
												handleTimeChange('minute', value)
											}
										>
											<SelectTrigger className='h-8 flex-1 text-xs'>
												<SelectValue placeholder='00' />
											</SelectTrigger>

											<SelectContent>
												{minutes.map((minute) => (
													<SelectItem
														key={minute}
														value={minute}
														disabled={
															selectedDate
																? !isTimeAvailable(
																		format(selectedDate, 'HH'),
																		minute,
																	)
																: false
														}
													>
														{minute}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>

								{availabilityLoading && (
									<div className='flex items-center gap-2 border-t px-3 py-2 text-xs text-muted-foreground'>
										<Loader2Icon className='size-3 animate-spin' />
										Verificando disponibilidade...
									</div>
								)}

								{!availabilityLoading &&
									availableTimes !== undefined &&
									availableTimes.length === 0 && (
										<p className='border-t px-3 py-2 text-xs text-destructive'>
											Não há horário disponível neste dia para a duração
											selecionada.
										</p>
									)}

								{!availabilityLoading &&
									availableTimes !== undefined &&
									availableTimes.length > 0 &&
									!selectedTimeIsAvailable && (
										<p className='border-t px-3 py-2 text-xs text-destructive'>
											O horário atual está ocupado. Selecione outro.
										</p>
									)}

								<div className='px-3 pb-3 pt-2'>
									<Button
										type='button'
										size='sm'
										className='h-8 w-full text-xs'
										disabled={availabilityLoading || !selectedTimeIsAvailable}
										onClick={() => setIsOpen(false)}
									>
										Confirmar
									</Button>
								</div>
							</PopoverContent>
						</Popover>
					);
				}}
			/>

			{error && <p className='mt-1 text-xs text-destructive'>{error}</p>}
		</div>
	);
};

export default DateTimePickerForm;

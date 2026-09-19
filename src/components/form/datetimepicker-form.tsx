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
}: DateTimePickerFormProps<T>) => {
	const [isOpen, setIsOpen] = useState(false);

	// Geradores de opções para evitar hardcoding
	const hours = Array.from({ length: 24 }, (_, i) =>
		i.toString().padStart(2, '0'),
	);
	const minutes = Array.from({ length: 12 }, (_, i) =>
		(i * 5).toString().padStart(2, '0'),
	);

	return (
		<div className={cn('flex flex-col gap-1', className)}>
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

								if (firstAvailableMinute) {
									newDate.setMinutes(parseInt(firstAvailableMinute, 10));
								}
							}
						} else {
							newDate.setMinutes(parseInt(timeValue, 10));
						}

						field.onChange(newDate);
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
										'w-full justify-start text-left font-normal h-9 px-3',
										!selectedDate && 'text-muted-foreground',
										error && 'border-destructive',
									)}
								>
									<CalendarIcon className='mr-2 h-4 w-4' />
									{selectedDate ? (
										format(selectedDate, "dd/MM/yyyy 'às' HH:mm", {
											locale: ptBR,
										})
									) : (
										<span>{placeholder}</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent
								className='w-auto p-0 flex flex-col'
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
											newDate.setHours(9, 0);
										}
										field.onChange(newDate);
										onDateChange?.(newDate);
									}}
									locale={ptBR}
									initialFocus
								/>

								<div className='p-3 border-t border-border flex items-center justify-between gap-4 bg-muted/20'>
									<div className='flex items-center gap-1 w-full'>
										{/* HORAS */}
										<Select
											value={
												selectedDate ? format(selectedDate, 'HH') : undefined
											}
											onValueChange={(v) => handleTimeChange('hour', v)}
										>
											<SelectTrigger className='flex-1 h-8 text-xs'>
												<SelectValue placeholder='00' />
											</SelectTrigger>
											<SelectContent>
												{hours.map((h) => (
													<SelectItem
														key={h}
														value={h}
														disabled={!hasAvailableTimeInHour(h)}
													>
														{h}h
													</SelectItem>
												))}
											</SelectContent>
										</Select>

										<span className='text-xs font-bold'>:</span>

										{/* MINUTOS */}
										<Select
											value={
												selectedDate ? format(selectedDate, 'mm') : undefined
											}
											onValueChange={(v) => handleTimeChange('minute', v)}
										>
											<SelectTrigger className='flex-1 h-8 text-xs'>
												<SelectValue placeholder='00' />
											</SelectTrigger>
											<SelectContent>
												{minutes.map((m) => (
													<SelectItem
														key={m}
														value={m}
														disabled={
															selectedDate
																? !isTimeAvailable(
																		format(selectedDate, 'HH'),
																		m,
																	)
																: false
														}
													>
														{m}
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

								<div className='p-2 pb-3 px-3'>
									<Button
										type='button'
										size='sm'
										className='w-full text-xs h-8'
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

			{error && <p className='text-xs text-destructive mt-1'>{error}</p>}
		</div>
	);
};

export default DateTimePickerForm;

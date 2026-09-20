'use client';

import { monthNames } from '@/api/config/consts';
import { AppointmentsWithRelations } from '@/api/schema/appointments.schema';
import { CustomersWithRelations } from '@/api/schema/customers.schema';
import {
	formatPetTutorNames,
	PetsWithRelations,
} from '@/api/schema/pets.schema';
import { ShiftsWithRelations } from '@/api/schema/shifts.schema';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatCurrencyFromCents } from '@/helpers/currency';
import { addMonths, format, setMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
	CatIcon,
	ChevronLeft,
	ChevronRight,
	DogIcon,
	DotIcon,
	EyeClosedIcon,
	EyeIcon,
	PawPrintIcon,
	UserIcon,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface DashboardCardsProps {
	shifts: ShiftsWithRelations[];
	appointments: AppointmentsWithRelations[];
	createdPets: PetsWithRelations[];
	createdCustomers: CustomersWithRelations[];
}

const DashboardCards = ({
	shifts,
	appointments,
	createdPets,
	createdCustomers,
}: DashboardCardsProps) => {
	const [showValues, setShowValues] = useState<boolean>(false);

	const searchParams = useSearchParams();
	const pathname = usePathname();
	const router = useRouter();

	const monthParam = searchParams.get('month');
	const currentMonth = monthParam
		? setMonth(new Date(), monthNames.indexOf(monthParam.toLowerCase()))
		: new Date();

	const nonPaidShifts = shifts.filter((shift) => !shift.isPaid);
	const nonPaidAppointments = appointments.filter((appointment) => {
		return !appointment.isPaid;
	});

	const nonPaidAmountInCents = nonPaidShifts.reduce((acc, shift) => {
		return acc + (shift.amountInCents ?? 0);
	}, 0);

	const nonPaidAppointmentsAmountInCents = nonPaidAppointments.reduce(
		(acc, appointment) => {
			return acc + (appointment.totalPriceInCents ?? 0);
		},
		0,
	);

	const onMonthChange = (newDate: Date) => {
		const monthIndex = newDate.getMonth();
		const monthName = monthNames[monthIndex];

		const params = new URLSearchParams(searchParams);
		params.set('month', monthName);

		router.push(`${pathname}?${params.toString()}`);
	};

	const groupShiftsByClinic = (shiftsArray: ShiftsWithRelations[]) => {
		return shiftsArray.reduce(
			(acc, shift) => {
				const clinicName = shift.clinicName || 'Clínica não identificada';
				const amount = shift.amountInCents ?? 0;
				const requester = shift.requesterName?.trim() || 'Escala Fixa';

				if (!acc[clinicName]) {
					acc[clinicName] = { count: 0, total: 0, requesters: {} };
				}

				acc[clinicName].count += 1;
				acc[clinicName].total += amount;

				if (!acc[clinicName].requesters[requester]) {
					acc[clinicName].requesters[requester] = { count: 0, total: 0 };
				}
				acc[clinicName].requesters[requester].count += 1;
				acc[clinicName].requesters[requester].total += amount;

				return acc;
			},
			{} as Record<
				string,
				{
					count: number;
					total: number;
					requesters: Record<string, { count: number; total: number }>;
				}
			>,
		);
	};

	const allShiftsGrouped = groupShiftsByClinic(shifts);
	const nonPaidShiftsGrouped = groupShiftsByClinic(nonPaidShifts);

	const RenderClinicAccordion = (
		groupedData: ReturnType<typeof groupShiftsByClinic>,
	) => {
		const entries = Object.entries(groupedData);

		if (entries.length === 0) {
			return (
				<div className='flex items-center justify-center p-3 border rounded-lg bg-muted/5'>
					<p className='text-center text-muted-foreground'>Tudo em dia!</p>
				</div>
			);
		}

		return (
			<Accordion
				type='single'
				className='w-full flex flex-col gap-2'
				collapsible
			>
				{entries.map(([clinicName, data]) => (
					<AccordionItem
						key={clinicName}
						value={clinicName}
						className='border rounded-lg px-3 bg-muted/5'
					>
						<AccordionTrigger className='hover:no-underline py-3'>
							<div className='flex items-center justify-between w-full pr-4'>
								<div className='flex flex-col text-left'>
									<span className='text-sm font-bold'>{clinicName}</span>
									<span className='text-xs text-muted-foreground'>
										{data.count} {data.count === 1 ? 'plantão' : 'plantões'}
									</span>
								</div>
								<span className='font-mono font-semibold text-sm'>
									{showValues ? formatCurrencyFromCents(data.total) : '••••'}
								</span>
							</div>
						</AccordionTrigger>
						<AccordionContent className='flex flex-col gap-2 pt-0 pb-3'>
							<div className='text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 border-t pt-2'>
								Solicitantes
							</div>
							{Object.entries(data.requesters).map(([requester, reqData]) => (
								<div
									key={requester}
									className='flex justify-between items-center pl-2 border-l-2 border-primary/20'
								>
									<div className='flex flex-row gap-2 items-center'>
										<span className='text-xs text-muted-foreground'>
											{reqData.count}x
										</span>
										<span className='text-xs font-medium'>{requester}</span>
									</div>
									<span className='text-xs font-mono'>
										{showValues
											? formatCurrencyFromCents(reqData.total)
											: '••••'}
									</span>
								</div>
							))}
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
		);
	};

	return (
		<div className='flex flex-col gap-4 border rounded-lg p-4'>
			<div className='flex items-center justify-between p-4 border-b bg-muted/10'>
				<h2 className='text-lg font-bold capitalize'>
					{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
				</h2>
				<div className='flex gap-2'>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant='outline'
								size='icon'
								className='h-8 w-8'
								onClick={() => setShowValues((prev) => !prev)}
							>
								{showValues ? (
									<EyeIcon className='w-4 h-4' />
								) : (
									<EyeClosedIcon className='w-4 h-4' />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{showValues ? 'Esconder valores' : 'Mostrar valores'}
						</TooltipContent>
					</Tooltip>

					<Button
						variant='outline'
						size='icon'
						className='h-8 w-8'
						onClick={() => onMonthChange(subMonths(currentMonth, 1))}
					>
						<ChevronLeft className='w-4 h-4' />
					</Button>

					<Button
						variant='outline'
						size='icon'
						className='h-8 w-8'
						onClick={() => onMonthChange(addMonths(currentMonth, 1))}
					>
						<ChevronRight className='w-4 h-4' />
					</Button>
				</div>
			</div>

			<div className='flex flex-col lg:flex-row w-full gap-4'>
				<Card className='flex-1'>
					<CardHeader className='border-b text-center'>
						<CardTitle>Total de Plantões</CardTitle>
					</CardHeader>
					<CardDescription>
						<h1 className='text-center font-bold text-3xl'>
							<Dialog>
								<DialogTrigger className='font-bold cursor-pointer'>
									{shifts.length}
								</DialogTrigger>
								<DialogContent>
									<DialogTitle>Valores por Clínica</DialogTitle>
									<div className='flex flex-col gap-3'>
										{RenderClinicAccordion(allShiftsGrouped)}
									</div>
									<div className='flex justify-end w-full border rounded-lg bg-muted/10 p-3 gap-4'>
										<h1 className='font-bold'>Total:</h1>
										<h1 className='font-mono font-semibold'>
											{showValues
												? formatCurrencyFromCents(
														shifts.reduce(
															(acc, s) => acc + (s.amountInCents ?? 0),
															0,
														),
													)
												: '••••'}
										</h1>
									</div>
								</DialogContent>
							</Dialog>
						</h1>
					</CardDescription>
				</Card>

				<Card className='flex-1'>
					<CardHeader className='border-b text-center'>
						<CardTitle>Total de Plantões não pagos</CardTitle>
					</CardHeader>
					<CardDescription>
						<h1 className='text-center font-bold text-3xl'>
							<Dialog>
								<DialogTrigger className='font-bold cursor-pointer'>
									{nonPaidShifts.length}
								</DialogTrigger>
								<DialogContent className='sm:max-w-md'>
									<DialogTitle>Pendências por Clínica</DialogTitle>
									<div className='flex flex-col gap-3'>
										{RenderClinicAccordion(nonPaidShiftsGrouped)}
									</div>
									<div className='flex justify-end w-full border rounded-lg bg-muted/10 p-3 gap-4 mt-2'>
										<h1 className='font-bold'>Total Pendente:</h1>
										<h1 className='font-mono font-semibold'>
											{showValues
												? formatCurrencyFromCents(nonPaidAmountInCents)
												: '••••'}
										</h1>
									</div>
								</DialogContent>
							</Dialog>
						</h1>
					</CardDescription>
				</Card>

				<Card className='flex-1'>
					<CardHeader className='border-b text-center'>
						<CardTitle>Total a Receber</CardTitle>
					</CardHeader>
					<CardDescription>
						<h1 className='text-center font-bold text-3xl'>
							{showValues ? (
								formatCurrencyFromCents(nonPaidAmountInCents)
							) : (
								<div className='flex items-center justify-center gap-3'>
									<DotIcon className='w-9 h-9' />
									<DotIcon className='w-9 h-9' />
									<DotIcon className='w-9 h-9' />
									<DotIcon className='w-9 h-9' />
								</div>
							)}
						</h1>
					</CardDescription>
				</Card>
			</div>

			<div className='flex flex-col lg:flex-row w-full gap-4'>
				<Card className='flex-1'>
					<CardHeader className='border-b text-center'>
						<CardTitle>Total de Agendamentos</CardTitle>
					</CardHeader>
					<CardDescription>
						<h1 className='text-center font-bold text-3xl'>
							{appointments.length}
						</h1>
					</CardDescription>
				</Card>

				<Card className='flex-1'>
					<CardHeader className='border-b text-center'>
						<CardTitle>Total de Agendamentos não pagos</CardTitle>
					</CardHeader>
					<CardDescription>
						<h1 className='text-center font-bold text-3xl'>
							{nonPaidAppointments.length}
						</h1>
					</CardDescription>
				</Card>

				<Card className='flex-1'>
					<CardHeader className='border-b text-center'>
						<CardTitle>Total a Receber</CardTitle>
					</CardHeader>
					<CardDescription>
						<h1 className='text-center font-bold text-3xl'>
							{showValues ? (
								formatCurrencyFromCents(nonPaidAppointmentsAmountInCents)
							) : (
								<div className='flex items-center justify-center gap-3'>
									<DotIcon className='w-9 h-9' />
									<DotIcon className='w-9 h-9' />
									<DotIcon className='w-9 h-9' />
									<DotIcon className='w-9 h-9' />
								</div>
							)}
						</h1>
					</CardDescription>
				</Card>
			</div>

			<div className='flex flex-col lg:flex-row w-full gap-4'>
				<Card className='flex-1'>
					<CardHeader className='border-b text-center'>
						<CardTitle>Total de Pets Criados</CardTitle>
					</CardHeader>
					<CardDescription>
						<h1 className='text-center font-bold text-3xl'>
							<Dialog>
								<DialogTrigger className='font-bold cursor-pointer'>
									{createdPets.length}
								</DialogTrigger>
								<DialogContent>
									<DialogTitle>Pets Cadastrados</DialogTitle>
									<div className='flex flex-col gap-4 overflow-scroll max-h-100'>
										{createdPets.length > 0 ? (
											// adicionar sort por data de criação para mostrar os mais recentes primeiro
											createdPets
												.sort(
													(a, b) =>
														b.createdAt.getDate() - a.createdAt.getDate(),
												)
												.map((pet) => (
													<div
														key={pet.id}
														className='flex items-center justify-between gap-4 p-4 border rounded-lg'
													>
														<div className='flex items-center gap-4'>
															<div className='w-10 h-10 rounded-full bg-primary/10 p-2'>
																{pet.breed.specie.name === 'Canino' ? (
																	<DogIcon />
																) : pet.breed.specie.name === 'Felino' ? (
																	<CatIcon />
																) : (
																	<PawPrintIcon />
																)}
															</div>
															<div className='flex flex-col'>
																<h2 className='text-sm font-bold'>
																	{pet.name}
																</h2>
																<p className='text-xs'>
																	{formatPetTutorNames(pet)}
																</p>
															</div>
														</div>
													</div>
												))
										) : (
											<div className='flex items-center justify-center p-3 border rounded-lg bg-muted/5'>
												<p className='text-center text-muted-foreground'>
													Nenhum pet cadastrado.
												</p>
											</div>
										)}
									</div>
								</DialogContent>
							</Dialog>
						</h1>
					</CardDescription>
				</Card>

				<Card className='flex-1'>
					<CardHeader className='border-b text-center'>
						<CardTitle>Total de Clientes Criados</CardTitle>
					</CardHeader>
					<CardDescription>
						<h1 className='flex items-center justify-center font-bold text-3xl gap-4'>
							<Dialog>
								<DialogTrigger className='font-bold cursor-pointer'>
									{createdCustomers.length}
								</DialogTrigger>
								<DialogContent>
									<DialogTitle>Clientes Cadastrados</DialogTitle>
									<div className='flex flex-col gap-4 overflow-scroll max-h-100'>
										{createdCustomers.length > 0 ? (
											createdCustomers
												.sort(
													(a, b) =>
														b.createdAt.getDate() - a.createdAt.getDate(),
												)
												.map((customer) => (
													<div
														key={customer.id}
														className='flex items-center justify-between gap-4 p-4 border rounded-lg'
													>
														<div className='flex items-center gap-4'>
															<div className='w-10 h-10 rounded-full bg-primary/10 p-2'>
																<UserIcon />
															</div>
															<div className='flex flex-col'>
																<h2 className='text-sm font-bold'>
																	{customer.user.name}
																</h2>
																<p className='text-xs'>{customer.user.email}</p>
															</div>
														</div>
													</div>
												))
										) : (
											<div className='flex items-center justify-center p-3 border rounded-lg bg-muted/5'>
												<p className='text-center text-muted-foreground'>
													Nenhum cliente cadastrado.
												</p>
											</div>
										)}
									</div>
								</DialogContent>
							</Dialog>
						</h1>
					</CardDescription>
				</Card>
			</div>
		</div>
	);
};

export default DashboardCards;

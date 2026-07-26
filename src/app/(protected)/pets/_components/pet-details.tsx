'use client';
import { deleteTimelineItem } from '@/api/actions/timeline.actions';
import { BreedsWithRelations } from '@/api/schema/breeds.schema';
import { CustomersWithRelations } from '@/api/schema/customers.schema';
import { DoctorsWithRelations } from '@/api/schema/doctors.schema';
import {
	formatPetTutorNames,
	PetsWithRelations,
} from '@/api/schema/pets.schema';
import { Species } from '@/api/schema/species.schema';
import { TimelineItem, toTimelinePerson } from '@/api/schema/timeline.schema';
import { formatAge } from '@/api/util';
import { GoogleMapsIcon } from '@/components/icons/icon-googlemaps';
import EditButton from '@/components/list/edit-button';
import { Button } from '@/components/ui/button';
import LoadingDialog from '@/components/ui/loading';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@clerk/nextjs';
import { format, formatDate } from 'date-fns';
import {
	CalendarIcon,
	DropletIcon,
	FileIcon,
	FilmIcon,
	GalleryHorizontalIcon,
	MessageCircleIcon,
	PrinterIcon,
	ScaleIcon,
	ShoppingCartIcon,
	SquarePenIcon,
	StethoscopeIcon,
	SyringeIcon,
} from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import Image from 'next/image';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PetDetailsSkeleton } from './pet-details-skeleton';
import PetFormClient from './pet-form';
import TabHistory from './tabs/tab-history';
import TabTimeline from './tabs/tab-timeline';

interface PetDetailsClientProps {
	pet: PetsWithRelations;
	doctors: DoctorsWithRelations[];
	speciesPromise: Promise<Species[]>;
	breedsPromise: Promise<BreedsWithRelations[]>;
	customersPromise: Promise<CustomersWithRelations[]>;
}

const PetDetailsClient = ({
	pet,
	doctors,
	speciesPromise,
	breedsPromise,
	customersPromise,
}: PetDetailsClientProps) => {
	const { user, isLoaded } = useUser();

	const isCustomer = user?.publicMetadata?.role === 'customer';

	const [activeTab, setActiveTab] = useState<string>();

	const { execute, isExecuting } = useAction(deleteTimelineItem, {
		onSuccess: () => {
			toast.success('Item removido do histórico!');
		},
		onError: ({ error }) => {
			toast.error(
				'Erro ao deletar: ' + (error.serverError || 'Tente novamente'),
			);
		},
	});

	if (!isLoaded) {
		return <PetDetailsSkeleton />;
	}

	if (!activeTab) {
		setActiveTab(isCustomer ? 'timeline' : 'history');
		return <PetDetailsSkeleton />;
	}

	const species = use(speciesPromise);
	const breeds = use(breedsPromise);
	const customers = use(customersPromise);

	const age = formatAge(new Date(pet.birthDate));
	const primaryTutor = pet.petTutors[0]?.tutor;
	const fullAddress = primaryTutor
		? `${primaryTutor.address}, ${primaryTutor.addressNumber} - ${primaryTutor.neighborhood}, ${primaryTutor.city} - ${primaryTutor.state}`
		: '';
	const lastWeightGrams = pet.weightHistory?.[0]?.weightInGrams ?? 0;
	const lastWeightKg = lastWeightGrams / 1000;

	const googleMapsUrl = fullAddress
		? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
		: '';

	const tabOptions = [
		{ id: 'history', label: 'Histórico', icon: GalleryHorizontalIcon },
		{ id: 'protocols', label: 'Protocolos', icon: DropletIcon },
		{ id: 'timeline', label: 'Linha do Tempo', icon: FilmIcon },
		{ id: 'schedule', label: 'Agenda', icon: CalendarIcon },
		{ id: 'sales', label: 'Vendas', icon: ShoppingCartIcon },
	];

	const visibleTabs = tabOptions.filter((tab) => {
		if (tab.id === 'timeline') return true;
		return !isCustomer;
	});

	const historyEvents: TimelineItem[] = [
		...(pet.medicalRecords?.map((mr) => ({
			type: 'record' as const,
			id: mr.id,
			date: new Date(mr.createdAt),
			title: 'Atendimento Clínico',
			doctor: mr.doctor.user.name,
			avatarPerson: toTimelinePerson(mr.doctor.user),
			content: mr.diagnosis,
			icon: <StethoscopeIcon className='w-5 h-5 text-accent-foreground' />,
			color: 'bg-pathology/30',
		})) || []),
		...(pet.prescriptions?.map((p) => ({
			type: 'prescription' as const,
			id: p.id,
			date: new Date(p.issuedAt),
			title: 'Receita Emitida',
			doctor: p.doctor.user.name,
			avatarPerson: toTimelinePerson(p.doctor.user),
			content: (
				<div className='flex flex-col gap-2'>
					<div
						className='prose prose-sm dark:prose-invert max-w-none'
						dangerouslySetInnerHTML={{
							__html: p.content as string,
						}}
					/>

					<Button variant={'outline'} asChild>
						<Link href={`/prescriptions/print/${p.id}`}>
							<PrinterIcon /> Imprimir
						</Link>
					</Button>
				</div>
			),
			icon: <SquarePenIcon className='w-5 h-5 text-accent-foreground' />,
			color: 'bg-prescription/30',
		})) || []),
		...(pet.weightHistory?.map((w) => ({
			type: 'weight' as const,
			id: w.id,
			date: new Date(w.measuredAt),
			title: 'Pesagem',
			doctor: w.author?.name ?? '',
			avatarPerson: w.author ? toTimelinePerson(w.author) : undefined,
			content: `Peso registrado: ${(w.weightInGrams / 1000).toFixed(2)}kg`,
			icon: <ScaleIcon className='w-5 h-5 text-accent-foreground' />,
			color: 'bg-weight/30',
		})) || []),
		...(pet.appointments?.map((a) => ({
			type: 'appointment' as const,
			id: a.id,
			date: new Date(a.createdAt),
			title: 'Agendamento',
			doctor: a.doctor?.user?.name || 'Não atribuído',
			avatarPerson: a.doctor?.user
				? toTimelinePerson(a.doctor.user)
				: undefined,
			content:
				a.items?.map((i) => i.service.name).join(', ') +
					' - ' +
					formatDate(a.scheduledAt, 'dd/MM/yyyy HH:mm') || 'Nenhum serviço',
			icon: <CalendarIcon className='w-5 h-5 text-accent-foreground' />,
			color: 'bg-appointment/30',
		})) || []),
		...(pet.vaccines?.map((v) => ({
			type: 'vaccine' as const,
			id: v.id,
			date: new Date(v.applicationDate),
			title: 'Vacina',
			doctor: v.doctor?.user?.name || 'Não atribuído',
			avatarPerson: v.doctor?.user
				? toTimelinePerson(v.doctor.user)
				: undefined,
			content: (
				<div className='grid grid-cols-2'>
					<p className='flex gap-2'>
						<span className='font-bold'>Vacina: </span>
						{v.name}
					</p>
					<p className='flex gap-2'>
						<span className='font-bold'>Lote:</span>
						{v.lotNumber}
					</p>
					<p className='flex gap-2'>
						<span className='font-bold'>Fabricante:</span>
						{v.manufacturer}
					</p>
					<p className='flex gap-2'>
						<span className='font-bold'>Próxima dose:</span>
						{formatDate(v.nextDoseDate!, 'dd/MM/yyyy')}
					</p>
				</div>
			),
			icon: <SyringeIcon className='w-5 h-5 text-accent-foreground' />,
			color: 'bg-vaccine/30',
		})) || []),
		...(pet.pathologies?.map((p) => ({
			type: 'pathology' as const,
			id: p.id,
			date: new Date(p.diagnosedAt),
			title: 'Patologia',
			doctor: p.doctor.user.name,
			avatarPerson: toTimelinePerson(p.doctor.user),
			content: p.name,
			icon: <StethoscopeIcon className='w-5 h-5 text-accent-foreground' />,
			color: 'bg-pathology/30',
		})) || []),
		...(pet.attachments?.map((a) => ({
			type: 'attachment' as const,
			id: a.id,
			date: new Date(a.createdAt),
			title: 'Anexo',
			doctor: a.author.name,
			avatarPerson: toTimelinePerson(a.author),
			content: a.name,
			icon: <FileIcon className='w-5 h-5 text-accent-foreground' />,
			color: 'bg-document/30',
		})) || []),
		...(pet.notes?.map((n) => ({
			type: 'note' as const,
			id: n.id,
			date: new Date(n.createdAt),
			title: 'Observação',
			doctor: n.author.name,
			avatarPerson: toTimelinePerson(n.author),
			content: n.content,
			icon: <MessageCircleIcon className='w-5 h-5 text-accent-foreground' />,
			color: 'bg-notes/80',
		})) || []),
	]
		.filter((event) => !(isCustomer && event.type === 'note'))
		.sort((a, b) => b.date.getTime() - a.date.getTime());

	const handleDelete = (item: TimelineItem) => {
		if (!item.id) return;

		execute({
			id: item.id!,
			type: item.type,
			petId: pet.id,
		});
	};

	return (
		<div className='flex flex-col gap-4 w-full'>
			<div className='flex flex-col md:flex-row gap-4 w-full'>
				{/* Card da Foto e Nome */}
				<div className='flex flex-col items-center justify-start gap-4 p-5 w-full lg:min-w-75 lg:w-1/3 border border-muted rounded-lg bg-card'>
					<div className='relative w-40 h-40 md:w-50 md:h-50'>
						<Image
							src={
								pet?.photo
									? pet.photo
									: pet?.breed?.specie.name === 'Canino'
										? '/dog-placeholder.png'
										: '/cat-placeholder.svg'
							}
							alt='Foto do pet'
							fill
							draggable={false}
							className='rounded-full border border-zinc-300 object-cover select-none'
						/>
					</div>

					<div className='text-center'>
						<h1 className='font-bold text-2xl'>{pet.name}</h1>
						<p className='text-muted-foreground text-sm'>
							{pet.breed.specie.name} • {age}
						</p>
					</div>
				</div>

				{/* Card de Dados Cadastrais */}
				<div className='flex flex-col gap-4 p-5 w-full lg:w-2/3 border border-muted rounded-lg bg-card'>
					<div className='flex flex-row items-center justify-between gap-3'>
						<h2 className='text-xl font-semibold'>Dados Cadastrais</h2>

						{/* Botão de Edição */}
						{!isCustomer && (
							<EditButton
								tooltip={`Editar ${pet.name}`}
								renderForm={(close) => (
									<PetFormClient
										pet={{
											...pet,
											weightInGrams: lastWeightKg,
										}}
										breeds={breeds}
										customers={customers}
										species={species}
										onSuccess={close}
									/>
								)}
							/>
						)}
					</div>

					<Separator />

					<div className='grid grid-cols-2 gap-y-3 gap-x-4 text-sm'>
						<p>
							<span className='font-semibold text-muted-foreground'>
								Espécie:
							</span>{' '}
							{pet.breed.specie.name}
						</p>

						<p>
							<span className='font-semibold text-muted-foreground'>Raça:</span>{' '}
							{pet.breed.name}
						</p>

						<p>
							<span className='font-semibold text-muted-foreground'>
								Gênero:
							</span>{' '}
							{pet.gender === 'female' ? 'Fêmea' : 'Macho'}
						</p>

						<p>
							<span className='font-semibold text-muted-foreground'>Cor:</span>{' '}
							{pet.color}
						</p>

						<p>
							<span className='font-semibold text-muted-foreground'>
								Nascimento:
							</span>{' '}
							{format(new Date(pet.birthDate + 'T12:00:00'), 'dd/MM/yyyy')}
						</p>

						<p>
							<span className='font-semibold text-muted-foreground'>
								Idade:
							</span>{' '}
							{age}
						</p>

						<p className='col-span-2 w-full'>
							<span className='font-semibold text-muted-foreground'>
								Tutor(es):
							</span>{' '}
							{formatPetTutorNames(pet)}
						</p>

						<p className='col-span-2'>
							<span className='font-semibold text-muted-foreground'>
								Endereço:
							</span>{' '}
							{fullAddress || '—'}
						</p>

						{googleMapsUrl ? (
							<div className='col-span-2 pt-2'>
								<Button asChild variant='outline' className='w-full gap-2'>
									<Link href={googleMapsUrl} target='_blank'>
										<GoogleMapsIcon className='w-4 h-4' />
										Abrir no Google Maps
									</Link>
								</Button>
							</div>
						) : null}
					</div>
				</div>
			</div>

			<div className='flex flex-col gap-4 p-5 w-full border border-muted rounded-lg bg-card'>
				<h2 className='text-xl font-semibold'>Informações Adicionais</h2>
				<Separator />

				<Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
					{/* VIEW MOBILE: Dropdown (Select) */}
					<div className='md:hidden w-full'>
						<Select value={activeTab} onValueChange={setActiveTab}>
							<SelectTrigger className='w-full bg-muted/50 h-12'>
								<SelectValue placeholder='Selecione uma categoria' />
							</SelectTrigger>
							<SelectContent>
								{visibleTabs.map((tab) => (
									<SelectItem key={tab.id} value={tab.id}>
										<div className='flex items-center gap-2'>
											<tab.icon className='w-4 h-4' />
											<span>{tab.label}</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* VIEW DESKTOP: Tabs tradicionais */}
					<TabsList className='hidden md:flex w-full justify-start h-auto p-1 bg-muted/50 border'>
						{visibleTabs.map((tab) => (
							<TabsTrigger
								key={tab.id}
								value={tab.id}
								className='flex gap-2 px-4 py-2 hover:cursor-pointer'
							>
								<tab.icon className='w-4 h-4' />
								{tab.label}
							</TabsTrigger>
						))}
					</TabsList>

					<div className='p-4 border rounded-md bg-card'>
						<TabHistory
							doctors={doctors}
							historyEvents={historyEvents}
							petId={pet.id}
							canDelete={!isCustomer}
							onDelete={handleDelete}
						/>

						<TabsContent value='protocols'>
							<h1>Protocolos Clínicos</h1>
						</TabsContent>

						<TabTimeline
							historyEvents={historyEvents}
							canDelete={!isCustomer}
							onDelete={handleDelete}
						/>

						<TabsContent value='schedule'>
							<h1>Próximos Agendamentos</h1>
						</TabsContent>

						<TabsContent value='sales'>
							<h1>Histórico de Vendas</h1>
						</TabsContent>
					</div>
				</Tabs>
			</div>

			{isExecuting && <LoadingDialog />}
		</div>
	);
};

export default PetDetailsClient;

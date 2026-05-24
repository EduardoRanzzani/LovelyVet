'use client';

import { deletePet } from '@/api/actions/pets.actions';
import { MAX_PAGE_SIZE, PaginatedData } from '@/api/config/consts';
import { BreedsWithRelations } from '@/api/schema/breeds.schema';
import { CustomersWithRelations } from '@/api/schema/customers.schema';
import {
	formatPetTutorNames,
	PetsWithRelations,
} from '@/api/schema/pets.schema';
import { Species } from '@/api/schema/species.schema';
import { formatAge } from '@/api/util';
import { WhatsappIcon } from '@/components/icons/icon-whatsapp';
import AddButton from '@/components/list/add-button';
import DeleteAlertButton from '@/components/list/delete-alert-dialog';
import SearchInput from '@/components/list/search-input';
import TableComponent from '@/components/list/table-component';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge'; // Opcional: para status ou gênero
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TableCell, TableRow } from '@/components/ui/table';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatWeight } from '@/helpers/weight';
import { handleNavigation } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';
import {
	CalendarIcon,
	EyeIcon,
	MarsIcon,
	UserRoundIcon,
	VenusIcon,
	WeightIcon,
} from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { use } from 'react';
import { toast } from 'sonner';
import PetFormClient from './pet-form';

interface PetsListClientProps {
	pets: Promise<PaginatedData<PetsWithRelations>>;
	species: Species[];
	breeds: BreedsWithRelations[];
	customers: CustomersWithRelations[];
}

const PetsListClient = ({
	pets,
	species,
	breeds,
	customers,
}: PetsListClientProps) => {
	const { user } = useUser();
	const canDoActions = user?.publicMetadata?.role !== 'customer';

	const petsResolved = use(pets);
	const searchParams = useSearchParams();

	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('page', page.toString());
		handleNavigation(params);
	};

	// Formata gramas para Kg com uma casa decimal
	const handleDelete = (petId: string) => {
		deletePetAction.execute({
			id: petId,
		});
	};

	const deletePetAction = useAction(deletePet, {
		onSuccess: () => {
			toast.success('Pet deletado com sucesso!');
		},
		onError: (err) => {
			console.error('Erro ao deletar pet:', err);
			toast.error(
				'Ocorreu um erro ao tentar deletar o pet. Tente novamente mais tarde.',
			);
		},
	});

	const columns = [
		{ header: 'Nome', accessorKey: 'name' },
		{ header: 'Idade', accessorKey: 'age' },
		{ header: 'Peso', accessorKey: 'weight' },
		{ header: 'Tutor(es)', accessorKey: 'tutor' },
		{
			header: 'Ações',
			accessorKey: 'actions',
			className: `${canDoActions ? '' : 'hidden'}`,
		},
	];

	const renderRow = (pet: PetsWithRelations) => {
		const firstTutor = pet.petTutors[0]?.tutor;
		const firstName = firstTutor?.user.name.split(' ')[0] ?? '';
		const whatsappUrl = firstTutor
			? `https://wa.me/55${firstTutor.phone.replace(/\D/g, '')}/?text=Ol%C3%A1,%20tudo%20bem%3F%20Gostaria%20de%20falar%20com%20${firstName}%20sobre%20${pet.gender === 'female' ? 'a' : 'o'}%20${pet.name}`
			: '';

		return (
			<TableRow key={pet.id} className='group'>
				<TableCell className='flex gap-4 items-center'>
					<Avatar className='h-10 w-10 rounded-full' draggable={false}>
						{pet.photo ? (
							<AvatarImage
								src={pet.photo}
								alt={pet.name}
								draggable={false}
								className='object-cover'
							/>
						) : (
							<AvatarImage
								src={
									pet?.breed?.specie.name === 'Canino'
										? '/dog-placeholder.png'
										: '/cat-placeholder.svg'
								}
								alt={pet.name}
							/>
						)}
					</Avatar>

					<span className='flex flex-col'>
						<span className='font-medium'>{pet.name}</span>
						<p className='text-xs text-muted-foreground'>
							<Badge variant={pet.sterile ? 'default' : 'outline'}>
								<span className='text-xs'>
									{pet.sterile ? 'Castrado' : 'Fértil'}
								</span>
							</Badge>{' '}
							• {pet.breed.specie.name} • {pet.breed.name} • {pet.color}
						</p>
					</span>
				</TableCell>

				<TableCell>{formatAge(new Date(pet.birthDate))}</TableCell>
				<TableCell>
					{pet.weightHistory && pet.weightHistory.length > 0
						? formatWeight(pet.weightHistory[0].weightInGrams)
						: 'Peso não informado'}
				</TableCell>

				<TableCell>
					<div className='flex gap-4 items-center'>
						{whatsappUrl ? (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button asChild variant={'outline'} size={'icon'}>
										<Link target='_blank' href={whatsappUrl}>
											<WhatsappIcon />
										</Link>
									</Button>
								</TooltipTrigger>
								<TooltipContent>Conversar via WhatsApp</TooltipContent>
							</Tooltip>
						) : null}

						<div className='flex flex-col min-w-0'>
							<span className='text-sm font-medium'>
								{formatPetTutorNames(pet)}
							</span>
							{firstTutor ? (
								<span className='text-[10px] text-muted-foreground uppercase'>
									{firstTutor.phone}
								</span>
							) : null}
						</div>
					</div>
				</TableCell>

				<TableCell className='w-20 space-x-2'>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button size={'icon'} variant={'secondary'} asChild>
								<Link href={`/pets/${pet.id}`}>
									<EyeIcon className='h-4 w-4' />
								</Link>
							</Button>
						</TooltipTrigger>
						<TooltipContent>Visualizar {pet.name}</TooltipContent>
					</Tooltip>

					{canDoActions && (
						<DeleteAlertButton
							tooltip={`Deletar ${pet.name}`}
							action={() => handleDelete(pet.id)}
						/>
					)}
				</TableCell>
			</TableRow>
		);
	};

	const renderMobile = (pet: PetsWithRelations) => {
		const firstTutor = pet.petTutors[0]?.tutor;
		const firstName = firstTutor?.user.name.split(' ')[0] ?? '';
		const whatsappUrl = firstTutor
			? `https://wa.me/55${firstTutor.phone.replace(/\D/g, '')}/?text=Ol%C3%A1,%20tudo%20bem%3F%20Gostaria%20de%20falar%20com%20${firstName}%20sobre%20${pet.gender === 'female' ? 'a' : 'o'}%20${pet.name}`
			: '';

		return (
			<div key={pet.id} className='flex flex-col gap-4'>
				<div className='flex items-center justify-between'>
					<div className='flex gap-4'>
						<Avatar className='h-10 w-10 rounded-full' draggable={false}>
							{pet.photo ? (
								<AvatarImage
									src={pet.photo}
									alt={pet.name}
									draggable={false}
									className='object-cover'
								/>
							) : (
								<AvatarImage
									src={
										pet?.breed?.specie.name === 'Canino'
											? '/dog-placeholder.png'
											: '/cat-placeholder.svg'
									}
									alt={pet.name}
								/>
							)}
						</Avatar>

						<span className='flex flex-col'>
							<h3 className='font-bold'>{pet.name}</h3>
							<p className='text-xs text-muted-foreground'>
								{pet.breed.specie.name} • {pet.breed.name} • {pet.color} •{' '}
								<Badge variant={pet.sterile ? 'default' : 'outline'}>
									{pet.sterile ? 'Castrado' : 'Fértil'}
								</Badge>
							</p>
						</span>
					</div>

					<span className='flex flex-col gap-2'>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button size={'icon'} variant={'secondary'} asChild>
									<Link href={`/pets/${pet.id}`}>
										<EyeIcon className='h-4 w-4' />
									</Link>
								</Button>
							</TooltipTrigger>
							<TooltipContent>Visualizar {pet.name}</TooltipContent>
						</Tooltip>

						<DeleteAlertButton action={() => handleDelete(pet.id)} />
					</span>
				</div>

				<Separator />

				<div className='flex flex-col gap-2'>
					<p className='flex gap-2 items-center'>
						<span className='text-sm font-semibold'>
							{pet.gender === 'female' ? (
								<VenusIcon className='w-4 h-4' />
							) : (
								<MarsIcon className='w-4 h-4' />
							)}
						</span>
						<span className='text-sm'>
							{pet.gender === 'female' ? 'Fêmea' : 'Macho'}
						</span>
					</p>

					<p className='flex gap-2 items-center'>
						<span className='text-sm font-semibold'>
							<CalendarIcon className='w-4 h-4' />
						</span>
						<span className='text-sm'>
							{formatAge(new Date(pet.birthDate))}
						</span>
					</p>

					<p className='flex gap-2 items-center'>
						<span className='text-sm font-semibold'>
							<WeightIcon className='w-4 h-4' />
						</span>
						<span className='text-sm'>
							{pet.weightHistory && pet.weightHistory.length > 0
								? formatWeight(pet.weightHistory[0].weightInGrams)
								: 'Peso não informado'}
						</span>
					</p>
				</div>

				<Separator />

				<div className='flex flex-col gap-2'>
					<div className='flex gap-2 items-center'>
						<span className='text-sm font-semibold'>
							<UserRoundIcon className='w-4 h-4' />
						</span>
						<span className='flex flex-wrap items-center text-sm gap-4'>
							{pet.petTutors.length > 1 ? 'Tutores: ' : 'Tutor: '}
							{formatPetTutorNames(pet)}
						</span>
					</div>
					<div>
						{whatsappUrl ? (
							<Button asChild variant={'outline'} className='w-full'>
								<Link target='_blank' href={whatsappUrl}>
									<WhatsappIcon />
									Conversar
								</Link>
							</Button>
						) : null}
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className='flex flex-col w-full gap-4'>
			<div className='flex flex-col lg:flex-row items-center justify-between gap-4'>
				<SearchInput />

				{canDoActions && (
					<AddButton
						text='Adicionar Pet'
						renderForm={(close) => (
							<PetFormClient
								breeds={breeds}
								customers={customers}
								species={species}
								onSuccess={close}
							/>
						)}
					/>
				)}
			</div>

			<TableComponent
				emptyMessage='Nenhum pet encontrado...'
				columns={columns}
				renderRow={renderRow}
				renderMobile={renderMobile}
				data={petsResolved?.data}
				currentPage={petsResolved?.metadata.currentPage}
				totalPages={petsResolved?.metadata.pageCount}
				totalElements={petsResolved?.metadata.totalCount}
				pageSize={MAX_PAGE_SIZE}
				onPageChange={handlePageChange}
			/>
		</div>
	);
};

export default PetsListClient;

'use client';

import { deleteCustomer } from '@/api/actions/customers.actions';
import { MAX_PAGE_SIZE, PaginatedData } from '@/api/config/consts';
import { CustomersWithRelations } from '@/api/schema/customers.schema';
import { getInitials } from '@/api/util';
import { GoogleMapsIcon } from '@/components/icons/icon-googlemaps';
import { WhatsappIcon } from '@/components/icons/icon-whatsapp';
import AddButton from '@/components/list/add-button';
import DeleteAlertButton from '@/components/list/delete-alert-dialog';
import EditButton from '@/components/list/edit-button';
import SearchInput from '@/components/list/search-input';
import TableComponent from '@/components/list/table-component';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import LoadingDialog from '@/components/ui/loading';
import { Separator } from '@/components/ui/separator';
import { TableCell, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { handleNavigation } from '@/lib/utils';
import { IdCardIcon, MapPinIcon, PhoneIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { use } from 'react';
import { toast } from 'sonner';
import CustomerFormClient from './customer-form';

interface CustomersListClientProps {
	customers: Promise<PaginatedData<CustomersWithRelations>>;
}

const CustomersListClient = ({ customers }: CustomersListClientProps) => {
	const customersResolved = use(customers);
	const searchParams = useSearchParams();

	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('page', page.toString());
		handleNavigation(params);
	};

	const handleDelete = (customerId: string) => {
		deleteCustomerAction.execute({
			id: customerId,
		});
	};

	const deleteCustomerAction = useAction(deleteCustomer, {
		onSuccess: () => {
			toast.success('Cliente deletado com sucesso!');
		},
		onError: (err) => {
			console.error('Erro ao deletar cliente:', err);
			toast.error('Ocorreu um erro ao tentar deletar o cliente. Tente novamente mais tarde.');
		},
	});

	const columns = [
		{ header: 'Nome', accessorKey: 'name' },
		{ header: 'CPF', accessorKey: 'cpf' },
		{ header: 'Telefone', accessorKey: 'phone' },
		{ header: 'Endereço', accessorKey: 'address' },
		{ header: 'Ações', accessorKey: 'actions' },
	];

	const renderRow = (customer: CustomersWithRelations) => {
		const firstName = customer.user.name.split(' ')[0];
		const whatsappUrl = `https://wa.me/55${customer.phone.replace(/\D/g, '')}/?text=Ol%C3%A1,%20tudo%20bem%3F%20Gostaria%20de%20falar%20com%20${firstName}`;
		const fullAddress = `${customer.address}, ${customer.addressNumber} - ${customer.neighborhood}. ${customer.city}/${customer.state}`;
		const googleMapsUrl = `https://www.google.com/maps/place/${fullAddress}`;

		return (
			<TableRow key={customer.id}>
				<TableCell className='flex gap-4 items-center'>
					<Avatar className='h-10 w-10 rounded-full' draggable={false}>
						{customer.user.image ? (
							<AvatarImage
								src={customer.user.image}
								alt={customer.user.name}
								draggable={false}
								className='object-cover'
							/>
						) : (
							<AvatarImage src={'/avatar-placeholder.png'} alt={customer.user.name} />
						)}
					</Avatar>

					<span className='flex flex-col'>
						<h3>{customer.user.name}</h3>
						<p className='text-xs text-muted-foreground'>{customer.user.email}</p>
					</span>
				</TableCell>

				<TableCell className='max-w-30'>{customer.cpf}</TableCell>

				<TableCell>
					<div className='flex items-center gap-4'>
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
						<span>{customer.phone}</span>
					</div>
				</TableCell>

				<TableCell>
					<div className='flex items-center gap-4'>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button asChild variant={'outline'} className='2xl:size-9'>
									<Link href={googleMapsUrl} target='_blank'>
										<GoogleMapsIcon />
										<span className='flex 2xl:hidden'>Abrir no Google Maps</span>
									</Link>
								</Button>
							</TooltipTrigger>
							<TooltipContent>Abrir no Google Maps</TooltipContent>
						</Tooltip>
						<span className='hidden 2xl:flex'>{fullAddress}</span>
					</div>
				</TableCell>

				<TableCell className='w-20 space-x-2'>
					<EditButton
						tooltip={`Editar ${customer.user.name}`}
						renderForm={(close) => <CustomerFormClient customer={customer} onSuccess={close} />}
					/>

					<DeleteAlertButton action={() => handleDelete(customer.id)} />
				</TableCell>
			</TableRow>
		);
	};

	const renderMobile = (customer: CustomersWithRelations) => {
		const fullAddress = `${customer.address}, ${customer.addressNumber} - ${customer.neighborhood}. ${customer.city}/${customer.state}`;
		const whatsappUrl = `https://wa.me/55${customer.phone.replace(/\D/g, '')}/?text=Ol%C3%A1,%20gostaria%20de%20falar%20com%20${customer.user.name}`;
		const googleMapsUrl = `https://www.google.com/maps/place/${fullAddress}`;

		return (
			<div key={customer.id} className='flex flex-col gap-4'>
				<div className='flex items-center justify-between'>
					<div className='flex gap-4'>
						<Avatar className='h-10 w-10 rounded-full' draggable={false}>
							{customer.user.image ? (
								<AvatarImage src={customer.user.image} alt={customer.user.name} />
							) : (
								<AvatarFallback className='rounded-full'>
									{getInitials(customer.user.name)}
								</AvatarFallback>
							)}
						</Avatar>

						<span className='flex flex-col'>
							<h3 className='font-bold'>{customer.user.name}</h3>
							<p className='text-xs text-muted-foreground'>{customer.user.email}</p>
						</span>
					</div>

					<span className='flex flex-col gap-2'>
						<EditButton
							tooltip={`Editar ${customer.user.name}`}
							renderForm={(close) => <CustomerFormClient customer={customer} onSuccess={close} />}
						/>
						<DeleteAlertButton action={() => handleDelete(customer.id)} />
					</span>
				</div>

				<Separator />

				<div className='flex flex-col gap-2'>
					<p className='flex gap-2 items-center'>
						<span className='text-sm font-semibold'>
							<IdCardIcon className='w-4 h-4' />
						</span>
						<span className='text-sm'>{customer.cpf}</span>
					</p>

					<p className='flex gap-2 items-center'>
						<span className='text-sm font-semibold'>
							<PhoneIcon className='w-4 h-4' />
						</span>
						<span className='text-sm'>{customer.phone}</span>
					</p>

					<Button asChild variant={'outline'}>
						<Link target='_blank' href={whatsappUrl}>
							<WhatsappIcon />
							Conversar
						</Link>
					</Button>

					<p className='flex gap-2 items-center'>
						<span className='text-sm font-semibold'>
							<MapPinIcon className='w-4 h-4' />
						</span>
						<span className='text-sm flex gap-2 items-center'>{fullAddress}</span>
					</p>

					<Button asChild variant={'outline'}>
						<Link href={googleMapsUrl} target='_blank'>
							<GoogleMapsIcon />
							Abrir no Google Maps
						</Link>
					</Button>
				</div>
			</div>
		);
	};

	return (
		<div className='flex flex-col w-full gap-4'>
			<div className='flex flex-col lg:flex-row items-center justify-between gap-4'>
				<SearchInput />

				<AddButton text='Adicionar Cliente' renderForm={(close) => <CustomerFormClient onSuccess={close} />} />
			</div>

			{deleteCustomerAction.isPending && <LoadingDialog />}

			<TableComponent
				emptyMessage='Nenhum cliente encontrado...'
				columns={columns}
				renderRow={renderRow}
				renderMobile={renderMobile}
				data={customersResolved?.data}
				currentPage={customersResolved?.metadata.currentPage}
				totalPages={customersResolved?.metadata.pageCount}
				totalElements={customersResolved?.metadata.totalCount}
				pageSize={MAX_PAGE_SIZE}
				onPageChange={handlePageChange}
			/>
		</div>
	);
};

export default CustomersListClient;

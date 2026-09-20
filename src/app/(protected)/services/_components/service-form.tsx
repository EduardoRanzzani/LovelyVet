import { upsertService } from '@/api/actions/services.actions';
import {
	createServiceSchema,
	CreateServiceSchema,
	ServicesWithRelations,
} from '@/api/schema/services.schema';
import { Species } from '@/api/schema/species.schema';
import InputForm from '@/components/form/input-form';
import MoneyInputForm from '@/components/form/money-input-form';
import SelectForm from '@/components/form/select-form';
import { Button } from '@/components/ui/button';
import {
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import LoadingDialog from '@/components/ui/loading';
import { zodResolver } from '@hookform/resolvers/zod';
import { BanIcon, Loader2Icon, SaveIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface ServiceFormClientProps {
	service?: ServicesWithRelations;
	species: Species[];
	onSuccess?: () => void;
}

const ServiceFormClient = ({
	service,
	species,
	onSuccess,
}: ServiceFormClientProps) => {
	const form = useForm<CreateServiceSchema>({
		resolver: zodResolver(createServiceSchema),
		shouldUnregister: true,
		defaultValues: {
			name: service?.name || '',
			description: service?.description || '',
			specieId: service?.specieId || '',
			price: service?.priceInCents ? service.priceInCents / 100 : 0,
		},
	});

	const formSubmit = (data: CreateServiceSchema) => {
		upsertServiceAction.execute({
			...data,
			id: service?.id,
		});
	};

	const upsertServiceAction = useAction(upsertService, {
		onSuccess: () => {
			onSuccess?.();
			toast.success('Serviço salvo com sucesso!');
			form.reset();
		},
		onError: (err) => {
			console.error({ err });
			toast.error('Ocorreu um erro ao salvar o serviço!');
		},
	});

	return (
		<DialogContent
			onInteractOutside={(e) => e.preventDefault()}
			showCloseButton={false}
		>
			<DialogHeader>
				<DialogTitle>
					{service ? 'Editar Serviço' : 'Cadastrar Serviço'}
				</DialogTitle>
				<DialogDescription>
					{service
						? 'Atualize as informações do serviço selecionado'
						: 'Adicione um novo serviço ao sistema'}
				</DialogDescription>
			</DialogHeader>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(formSubmit)}>
					<div className='flex max-h-[calc(100dvh-12rem)] min-w-0 flex-col gap-2 overflow-y-auto px-1'>
						<InputForm
							label='Nome:'
							register={form.register}
							name='name'
							error={form.formState.errors.name?.message}
						/>

						<SelectForm
							label='Espécie:'
							name='specieId'
							control={form.control}
							error={form.formState.errors.specieId?.message}
							options={[
								{ value: '', label: 'Geral' },
								...species.map((specie) => ({
									value: specie.id,
									label: specie.name,
									key: specie.id,
								})),
							]}
						/>

						<MoneyInputForm
							label='Valor:'
							control={form.control}
							name='price'
							error={form.formState.errors.price?.message}
						/>

						<InputForm
							label='Descrição:'
							register={form.register}
							name='description'
							error={form.formState.errors.description?.message}
						/>
					</div>

					{upsertServiceAction.isPending && <LoadingDialog />}

					<DialogFooter className='mt-4'>
						<DialogClose asChild>
							<Button
								type='button'
								variant={'destructive'}
								onClick={() => {
									if (!upsertServiceAction.isPending) form.reset();
								}}
								className='flex-1'
							>
								<BanIcon />
								Cancelar
							</Button>
						</DialogClose>

						<Button
							type='submit'
							disabled={upsertServiceAction.isPending}
							className='flex-1'
						>
							{upsertServiceAction.isPending ? (
								<Loader2Icon className='h-5 w-5 animate-spin' />
							) : (
								<>
									<SaveIcon />
									Salvar
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</Form>
		</DialogContent>
	);
};

export default ServiceFormClient;

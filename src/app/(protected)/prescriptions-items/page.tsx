import { getPrescriptionsItemsPaginated } from '@/api/actions/prescriptions-items.actions';
import { MAX_PAGE_SIZE } from '@/api/config/consts';
import { ListSkeleton } from '@/components/list/list-skeleton';
import {
	PageContainer,
	PageContent,
	PageDescription,
	PageHeader,
	PageHeaderContent,
	PageTitle,
} from '@/components/shared/page-container';
import LoadingDialog from '@/components/ui/loading';
import { Suspense } from 'react';
import { PrescriptionsItemsListClient } from './_components/prescriptions-items-list';

interface PrescriptionItemsPageProps {
	searchParams: Promise<{ page?: string; filter?: string; keyword?: string }>;
}

const PrescriptionsItemsPage = async ({
	searchParams,
}: PrescriptionItemsPageProps) => {
	const params = await searchParams;
	const page = Number(params.page) || 1;
	const filter = params.filter || '';

	const dataPromise = getPrescriptionsItemsPaginated(
		page,
		MAX_PAGE_SIZE,
		filter,
	);

	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Itens de Receitas</PageTitle>
				</PageHeaderContent>
			</PageHeader>

			<PageContent>
				<PageDescription>
					Cadastro de itens que podem ser adicionados às receitas para facilitar
					o preenchimento e padronização dos tratamentos prescritos.
				</PageDescription>
				<Suspense
					fallback={
						<>
							<ListSkeleton />
							<LoadingDialog />
						</>
					}
				>
					<PrescriptionsItemsListClient prescriptionsItems={dataPromise} />
				</Suspense>
			</PageContent>
		</PageContainer>
	);
};

export default PrescriptionsItemsPage;

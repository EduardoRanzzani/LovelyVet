import { getCustomersPaginated } from '@/api/actions/customers.actions';
import { MAX_PAGE_SIZE } from '@/api/config/consts';
import {
	PageContainer,
	PageContent,
	PageDescription,
	PageHeader,
	PageHeaderContent,
	PageTitle,
} from '@/components/shared/page-container';
import { ListSkeleton } from '@/components/list/list-skeleton';
import LoadingDialog from '@/components/ui/loading';
import { requirePageAccess } from '@/lib/security/authorization';
import { Suspense } from 'react';
import CustomersListClient from './_component/customers-list';

interface CustomersPageProps {
	searchParams: Promise<{ page?: string; filter?: string; keyword?: string }>;
}

const CustomersPage = async ({ searchParams }: CustomersPageProps) => {
	await requirePageAccess('/customers');

	const params = await searchParams;
	const page = Number(params.page) || 1;
	const filter = params.filter || '';

	const dataPromise = getCustomersPaginated(page, MAX_PAGE_SIZE, filter);

	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Clientes</PageTitle>
				</PageHeaderContent>
			</PageHeader>

			<PageContent>
				<PageDescription>
					Listagem de todos os clientes cadastrados no sistema
				</PageDescription>
				<Suspense
					fallback={
						<>
							<ListSkeleton />
							<LoadingDialog />
						</>
					}
				>
					<CustomersListClient customers={dataPromise} />
				</Suspense>
			</PageContent>
		</PageContainer>
	);
};

export default CustomersPage;

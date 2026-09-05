import { getBreeds } from '@/api/actions/breeds.actions';
import { getCustomers } from '@/api/actions/customers.actions';
import { getPetsPaginated } from '@/api/actions/pets.actions';
import { getSpecies } from '@/api/actions/species.actions';
import { MAX_PAGE_SIZE } from '@/api/config/consts';
import {
	PageContainer,
	PageContent,
	PageDescription,
	PageHeader,
	PageHeaderContent,
	PageTitle,
} from '@/components/shared/page-container';
import { Suspense } from 'react';
import PetsListClient from './_components/pets-list';
import { ListSkeleton } from '@/components/list/list-skeleton';
import LoadingDialog from '@/components/ui/loading';
import { requireAuthContext } from '@/lib/security/auth-context';
import { hasRole } from '@/lib/security/authorization';

interface PetsPageProps {
	searchParams: Promise<{ page?: string; filter?: string; keyword?: string }>;
}

const PetsPage = async ({ searchParams }: PetsPageProps) => {
	const params = await searchParams;
	const page = Number(params.page) || 1;
	const filter = params.filter || '';

	const context = await requireAuthContext();
	const canManagePets = hasRole(context, 'admin', 'doctor');

	const dataPromise = getPetsPaginated(page, MAX_PAGE_SIZE, filter);
	const [species, breeds, customers] = await Promise.all([
		getSpecies(),
		getBreeds(),
		canManagePets ? getCustomers() : Promise.resolve([]),
	]);

	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Pets</PageTitle>
				</PageHeaderContent>
			</PageHeader>

			<PageContent>
				<PageDescription>
					Listagem de todos os pets cadastrados no sistema
				</PageDescription>
				<Suspense
					fallback={
						<>
							<ListSkeleton />
							<LoadingDialog />
						</>
					}
				>
					<PetsListClient
						pets={dataPromise}
						species={species}
						breeds={breeds}
						customers={customers}
					/>
				</Suspense>
			</PageContent>
		</PageContainer>
	);
};

export default PetsPage;

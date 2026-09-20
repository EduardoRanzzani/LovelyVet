import { getBreedsPaginated } from '@/api/actions/breeds.actions';
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
import { ListSkeleton } from '@/components/list/list-skeleton';
import LoadingDialog from '@/components/ui/loading';
import { requirePageAccess } from '@/lib/security/authorization';
import { Suspense } from 'react';
import BreedsListClient from './_components/breeds-list';

interface BreedsPageProps {
	searchParams: Promise<{ page?: string; filter?: string; keyword?: string }>;
}

const BreedsPage = async ({ searchParams }: BreedsPageProps) => {
	await requirePageAccess('/breeds');

	const params = await searchParams;
	const page = Number(params.page) || 1;
	const filter = params.filter || '';

	const dataPromise = getBreedsPaginated(page, MAX_PAGE_SIZE, filter);

	const species = await getSpecies();

	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Raças</PageTitle>
				</PageHeaderContent>
			</PageHeader>

			<PageContent>
				<PageDescription>
					Listagem de todos as raças de pets cadastradas no sistema
				</PageDescription>
				<Suspense
					fallback={
						<>
							<ListSkeleton />
							<LoadingDialog />
						</>
					}
				>
					<BreedsListClient breeds={dataPromise} species={species} />
				</Suspense>
			</PageContent>
		</PageContainer>
	);
};

export default BreedsPage;

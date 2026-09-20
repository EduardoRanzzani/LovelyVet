import { getSpeciesPaginated } from '@/api/actions/species.actions';
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
import { Suspense } from 'react';
import SpeciesListClient from './_components/species-list';
import LoadingDialog from '@/components/ui/loading';
import { requirePageAccess } from '@/lib/security/authorization';

interface SpeciesPageProps {
	searchParams: Promise<{ page?: string; filter?: string; keyword?: string }>;
}

const SpeciesPage = async ({ searchParams }: SpeciesPageProps) => {
	await requirePageAccess('/species');

	const params = await searchParams;
	const page = Number(params.page) || 1;
	const filter = params.filter || '';

	const dataPromise = getSpeciesPaginated(page, MAX_PAGE_SIZE, filter);

	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Espécies</PageTitle>
				</PageHeaderContent>
			</PageHeader>

			<PageContent>
				<PageDescription>
					Listagem de todos as espécies de pets cadastradas no sistema
				</PageDescription>
				<Suspense
					fallback={
						<>
							<ListSkeleton />
							<LoadingDialog />
						</>
					}
				>
					<SpeciesListClient species={dataPromise} />
				</Suspense>
			</PageContent>
		</PageContainer>
	);
};

export default SpeciesPage;

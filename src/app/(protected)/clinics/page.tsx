import { getClinicsPaginated } from '@/api/actions/clinics.actions';
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
import { requirePageAccess } from '@/lib/security/authorization';
import { Suspense } from 'react';
import ClinicsListClient from './_components/clinics-list';

interface ClinicsPageProps {
	searchParams: Promise<{ page?: string; filter?: string; keyword?: string }>;
}

const ClinicsPage = async ({ searchParams }: ClinicsPageProps) => {
	await requirePageAccess('/clinics');

	const params = await searchParams;
	const page = Number(params.page) || 1;
	const filter = params.filter || '';

	const dataPromise = getClinicsPaginated(page, MAX_PAGE_SIZE, filter);

	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Clínicas</PageTitle>
				</PageHeaderContent>
			</PageHeader>

			<PageContent>
				<PageDescription>
					Lista de clínicas previamente cadastradas para plantões
				</PageDescription>
				<Suspense
					fallback={
						<>
							<ListSkeleton />
							<LoadingDialog />
						</>
					}
				>
					<ClinicsListClient clinics={dataPromise} />
				</Suspense>
			</PageContent>
		</PageContainer>
	);
};

export default ClinicsPage;

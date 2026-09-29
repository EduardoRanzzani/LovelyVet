import { getPrescriptionsPaginated } from '@/api/actions/prescriptions.actions';
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
import PrescriptionsListClient from './_component/prescriptions-list';

interface PrescriptionsPageProps {
	searchParams: Promise<{
		page?: string;
		filter?: string;
	}>;
}

export default async function PrescriptionsPage({
	searchParams,
}: PrescriptionsPageProps) {
	await requirePageAccess('/prescriptions');

	const params = await searchParams;
	const page = Number(params.page) || 1;
	const filter = params.filter || '';

	const prescriptions = getPrescriptionsPaginated(page, MAX_PAGE_SIZE, filter);

	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Receitas</PageTitle>
				</PageHeaderContent>
			</PageHeader>

			<PageContent>
				<PageDescription>
					Consulte as receitas emitidas e acesse o documento do paciente.
				</PageDescription>

				<Suspense
					fallback={
						<>
							<ListSkeleton />
							<LoadingDialog />
						</>
					}
				>
					<PrescriptionsListClient prescriptions={prescriptions} />
				</Suspense>
			</PageContent>
		</PageContainer>
	);
}

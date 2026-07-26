import { getDoctors } from '@/api/actions/doctors.actions';
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
import { Suspense } from 'react';
import PrescriptionsTemplateListClient from './_component/prescriptions-list';

interface PrescriptionsTemplatePageProps {
	searchParams: Promise<{ page?: string; filter?: string; keyword?: string }>;
}

const PrescriptionsTemplatePage = async ({
	searchParams,
}: PrescriptionsTemplatePageProps) => {
	const params = await searchParams;
	const page = Number(params.page) || 1;
	const filter = params.filter || '';

	const dataPromise = getPrescriptionsPaginated(page, MAX_PAGE_SIZE, filter);

	const doctors = await getDoctors();

	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Modelos de Receitas</PageTitle>
				</PageHeaderContent>
			</PageHeader>

			<PageContent>
				<PageDescription>
					Listagem e cadastro de modelos de receita para serem utilizados
				</PageDescription>
				<Suspense
					fallback={
						<>
							<ListSkeleton />
							<LoadingDialog />
						</>
					}
				>
					<PrescriptionsTemplateListClient
						prescriptions={dataPromise}
						doctors={doctors}
					/>
				</Suspense>
			</PageContent>
		</PageContainer>
	);
};

export default PrescriptionsTemplatePage;

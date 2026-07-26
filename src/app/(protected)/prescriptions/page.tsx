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
import PrescriptionsListClient from './_component/prescriptions-list';
import { getPets } from '@/api/actions/pets.actions';
import { getPrescriptionsItems } from '@/api/actions/prescriptions-items.actions';

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

	const prescriptionItems = await getPrescriptionsItems();
	const doctors = await getDoctors();
	const pets = await getPets();

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
					<PrescriptionsListClient
						prescriptionItems={prescriptionItems}
						prescriptions={dataPromise}
						doctors={doctors}
						pets={pets}
					/>
				</Suspense>
			</PageContent>
		</PageContainer>
	);
};

export default PrescriptionsTemplatePage;

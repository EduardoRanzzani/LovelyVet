import { getAppointmentsPaginated } from '@/api/actions/appointments.actions';
import { getDoctorsForSelection } from '@/api/actions/doctors.actions';
import { getPetsForSelection } from '@/api/actions/pets.actions';
import { getServices } from '@/api/actions/services.actions';
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
import { Suspense } from 'react';
import AppointmentsListClient from './_components/appointments-list';

interface AppointmentsPageProps {
	searchParams: Promise<{ page?: string; filter?: string; keyword?: string }>;
}

const AppointmentsPage = async ({ searchParams }: AppointmentsPageProps) => {
	const params = await searchParams;
	const page = Number(params.page) || 1;
	const filter = params.filter || '';

	const pets = await getPetsForSelection();
	const doctors = await getDoctorsForSelection();
	const services = await getServices();

	const dataPromise = getAppointmentsPaginated(page, MAX_PAGE_SIZE, filter);

	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Agendamentos</PageTitle>
				</PageHeaderContent>
			</PageHeader>

			<PageContent>
				<PageDescription>
					Listagem de todos os agendamentos registrados no sistema
				</PageDescription>
				<Suspense
					fallback={
						<>
							<ListSkeleton />
							<LoadingDialog />
						</>
					}
				>
					<AppointmentsListClient
						appointments={dataPromise}
						services={services}
						pets={pets}
						doctors={doctors}
					/>
				</Suspense>
			</PageContent>
		</PageContainer>
	);
};

export default AppointmentsPage;

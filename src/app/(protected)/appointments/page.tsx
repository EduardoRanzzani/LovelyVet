import { getUnifiedAppointmentsPaginated } from '@/api/actions/unified-appointments.actions';
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
import { requirePageAccess } from '@/lib/security/authorization';
import { Suspense } from 'react';
import AppointmentsListClient from './_components/appointments-list';

interface AppointmentsPageProps {
	searchParams: Promise<{ page?: string; filter?: string; keyword?: string }>;
}

const AppointmentsPage = async ({ searchParams }: AppointmentsPageProps) => {
	const context = await requirePageAccess('/appointments');

	const params = await searchParams;
	const page = Number(params.page) || 1;
	const filter = params.filter || '';

	const pets = await getPetsForSelection();
	const doctors = await getDoctorsForSelection();
	const services = await getServices();

	const dataPromise = getUnifiedAppointmentsPaginated(page, MAX_PAGE_SIZE, filter);

	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Agendamentos</PageTitle>
				</PageHeaderContent>
			</PageHeader>

			<PageContent>
				<PageDescription>
					Agendamentos de serviços e retornos clínicos em um único lugar
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
						viewerRole={context.role}
					/>
				</Suspense>
			</PageContent>
		</PageContainer>
	);
};

export default AppointmentsPage;

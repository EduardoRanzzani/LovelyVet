import { getDoctors } from '@/api/actions/doctors.actions';
import { getShifts } from '@/api/actions/shifts.actions';
import {
	PageContainer,
	PageContent,
	PageDescription,
	PageHeader,
	PageHeaderContent,
	PageTitle,
} from '@/components/shared/page-container';
import CustomCalendarSkeleton from '@/components/ui/custom-calendar-skeleton';
import LoadingDialog from '@/components/ui/loading';
import { requirePageAccess } from '@/lib/security/authorization';
import { Suspense } from 'react';
import ShiftsCalendarClient from './_components/shifts-calendar';
import { getClinicsForShiftSelection } from '@/api/actions/clinics.actions';

interface ShiftsPageProps {
	searchParams: Promise<{ month?: string }>;
}

const ShiftsPage = async ({ searchParams }: ShiftsPageProps) => {
	await requirePageAccess('/shifts');

	const params = await searchParams;

	// Captura o mês da URL ou define o mês atual como fallback
	const currentMonth = params.month;

	// Busca os dados
	const shiftsPromise = getShifts(currentMonth, true);

	const [doctors, clinics] = await Promise.all([
		getDoctors(),
		getClinicsForShiftSelection(),
	]);

	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Agenda de Plantões</PageTitle>
				</PageHeaderContent>
			</PageHeader>

			<PageContent>
				<PageDescription>
					Visualize e gerencie os plantões do mês selecionado.
				</PageDescription>
				<Suspense
					fallback={
						<>
							<CustomCalendarSkeleton />
							<LoadingDialog />
						</>
					}
				>
					<ShiftsCalendarClient
						shiftsPromise={shiftsPromise}
						doctors={doctors}
						clinics={clinics}
					/>
				</Suspense>
			</PageContent>
		</PageContainer>
	);
};

export default ShiftsPage;

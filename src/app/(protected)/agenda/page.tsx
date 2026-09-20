import { getCalendarEntries } from '@/api/actions/calendar.actions';
import { getDoctors } from '@/api/actions/doctors.actions';
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
import AgendaCalendarClient from './_components/agenda-calendar';
import { REGINA_DOCTOR_ID } from '@/api/config/consts';

interface AgendaPageProps {
	searchParams: Promise<{
		month?: string;
		year?: string;
		doctor?: string;
	}>;
}

const AgendaPage = async ({ searchParams }: AgendaPageProps) => {
	const params = await searchParams;

	const context = await requirePageAccess('/agenda');

	const doctors = await getDoctors();

	const isAllDoctors = context.role !== 'doctor' && params.doctor === 'all';

	const requestedDoctorId =
		params.doctor &&
		params.doctor !== 'all' &&
		doctors.some((doctor) => doctor.id === params.doctor)
			? params.doctor
			: undefined;

	const selectedDoctorId =
		context.role === 'doctor'
			? (context.doctorId ?? undefined)
			: isAllDoctors
				? undefined
				: (requestedDoctorId ?? REGINA_DOCTOR_ID);

	const parsedYear = params.year ? Number(params.year) : undefined;

	const year =
		parsedYear && Number.isInteger(parsedYear) ? parsedYear : undefined;

	const entriesPromise = getCalendarEntries(
		params.month,
		true,
		selectedDoctorId,
		year,
	);

	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Agenda</PageTitle>
				</PageHeaderContent>
			</PageHeader>

			<PageContent>
				<PageDescription>
					Visualize atendimentos, plantões, compromissos pessoais e lembretes em
					uma única agenda.
				</PageDescription>

				<Suspense
					fallback={
						<>
							<CustomCalendarSkeleton />
							<LoadingDialog />
						</>
					}
				>
					<AgendaCalendarClient
						entriesPromise={entriesPromise}
						doctors={doctors}
						viewerRole={context.role === 'doctor' ? 'doctor' : 'admin'}
						viewerDoctorId={context.doctorId}
						selectedDoctorId={selectedDoctorId}
					/>
				</Suspense>
			</PageContent>
		</PageContainer>
	);
};

export default AgendaPage;

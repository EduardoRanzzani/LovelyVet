import { getAppointmentsPaginated } from '@/api/actions/appointments.actions';
import { getClinicalRemindersPaginated } from '@/api/actions/clinical-reminders.actions';
import { getBillingOverviews } from '@/lib/finance/billing-queries';
import { getDoctorsForSelection } from '@/api/actions/doctors.actions';
import { getPetsForSelection } from '@/api/actions/pets.actions';
import { getServices } from '@/api/actions/services.actions';
import { getProducts } from '@/api/actions/products.actions';
import { MAX_PAGE_SIZE } from '@/api/config/consts';
import { formatShiftMonth, resolveShiftMonth } from '@/lib/shifts/shift-month';
import {
  PageContainer, PageContent, PageDescription, PageHeader, PageHeaderContent, PageTitle,
} from '@/components/shared/page-container';
import { ListSkeleton } from '@/components/list/list-skeleton';
import { requirePageAccess } from '@/lib/security/authorization';
import { Suspense } from 'react';
import AppointmentsListClient from './_components/appointments-list';

interface AppointmentsPageProps {
  searchParams: Promise<{ appointmentsPage?: string; remindersPage?: string; filter?: string; month?: string }>;
}

const pageNumber = (value?: string) => {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : 1;
};

export default async function AppointmentsPage({ searchParams }: AppointmentsPageProps) {
  const context = await requirePageAccess('/appointments');
  const params = await searchParams;
  const keyword = params.filter ?? '';
  const month = formatShiftMonth(resolveShiftMonth(params.month));
  const [pets, doctors, services, products] = await Promise.all([
    getPetsForSelection(),
    getDoctorsForSelection(),
    getServices(),
    context.role === 'customer' ? Promise.resolve([]) : getProducts(),
  ]);
  const appointments = getAppointmentsPaginated(pageNumber(params.appointmentsPage), MAX_PAGE_SIZE, keyword, month);
  const reminders = getClinicalRemindersPaginated(pageNumber(params.remindersPage), MAX_PAGE_SIZE, keyword, month);
  const billing = context.role === 'customer'
    ? Promise.resolve({})
    : appointments.then((result) => getBillingOverviews(result.data.map((item) => item.id)));

  return (
    <PageContainer>
      <PageHeader><PageHeaderContent><PageTitle>Agendamentos</PageTitle></PageHeaderContent></PageHeader>
      <PageContent>
        <PageDescription>Gerencie atendimentos, retornos e lembretes clínicos.</PageDescription>
        <Suspense fallback={<ListSkeleton />}>
          <AppointmentsListClient
            appointments={appointments}
            reminders={reminders}
            billing={billing}
            pets={pets}
            doctors={doctors}
            services={services}
            products={products}
            viewerRole={context.role}
            month={month}
          />
        </Suspense>
      </PageContent>
    </PageContainer>
  );
}

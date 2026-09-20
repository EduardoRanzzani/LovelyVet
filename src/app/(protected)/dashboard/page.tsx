import { getAppointments } from '@/api/actions/appointments.actions';
import { getCreatedPets } from '@/api/actions/pets.actions';
import { getShifts } from '@/api/actions/shifts.actions';
import {
	PageContainer,
	PageContent,
	PageDescription,
	PageHeader,
	PageHeaderContent,
	PageTitle,
} from '@/components/shared/page-container';
import { db } from '@/db';
import { customersTable } from '@/db/schema';
import { findUserByClerkUserId } from '@/lib/security/user-identity';
import { auth } from '@clerk/nextjs/server';
import { format } from 'date-fns';
import { eq } from 'drizzle-orm';
import OnboardingCustomerFormDialog from '../customers/_component/onboarding-customer-form';
import DashboardCards from './_components/dashboard-cards';
import { getCreatedCustomers } from '@/api/actions/customers.actions';
interface DashboardPageProps {
	searchParams: Promise<{ month?: string }>;
}

const DashboardPage = async ({ searchParams }: DashboardPageProps) => {
	const params = await searchParams;

	const { userId, isAuthenticated } = await auth();

	if (!isAuthenticated || !userId)
		return <div>Redirecionando para login...</div>;

	const existingUser = await findUserByClerkUserId(userId);

	if (!existingUser) {
		return (
			<PageContainer>
				<PageHeader>
					<PageHeaderContent>
						<PageTitle>Dashboard</PageTitle>
					</PageHeaderContent>
				</PageHeader>

				<PageContent>
					<PageDescription>Usuário não encontrado</PageDescription>
				</PageContent>
			</PageContainer>
		);
	}

	const existingCustomer = await db.query.customersTable.findFirst({
		where: eq(customersTable.userId, existingUser.id),
	});

	const needsToCreateCustomer =
		existingUser.role === 'customer' && !existingCustomer;

	const monthName = params.month || format(new Date(), 'MMMM').toLowerCase();
	const dashboardData =
		existingUser.role !== 'customer'
			? await Promise.all([
					getShifts(monthName, false),
					getAppointments(monthName, false),
					getCreatedPets(monthName),
					getCreatedCustomers(monthName),
				])
			: null;

	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Dashboard</PageTitle>
				</PageHeaderContent>
			</PageHeader>

			<PageContent>
				<PageDescription>Olá, {existingUser.name}!</PageDescription>

				{dashboardData && (
					<DashboardCards
						shifts={dashboardData[0]}
						appointments={dashboardData[1]}
						createdPets={dashboardData[2]}
						createdCustomers={dashboardData[3]}
					/>
				)}

				{needsToCreateCustomer && (
					<OnboardingCustomerFormDialog isOpen={needsToCreateCustomer} />
				)}
			</PageContent>
		</PageContainer>
	);
};

export default DashboardPage;

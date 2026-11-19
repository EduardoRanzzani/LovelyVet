import { getAppointments } from '@/api/actions/appointments.actions';
import { getCreatedCustomers } from '@/api/actions/customers.actions';
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
import { eq } from 'drizzle-orm';
import type { ReactNode } from 'react';
import OnboardingCustomerFormDialog from '../customers/_component/onboarding-customer-form';
import DashboardCards from './_components/dashboard-cards';
import DoctorDashboard from './_components/doctor-dashboard';

interface DashboardPageProps {
	searchParams: Promise<{ month?: string }>;
}

const DashboardPage = async ({ searchParams }: DashboardPageProps) => {
	const params = await searchParams;

	const { userId, isAuthenticated } = await auth();

	if (!isAuthenticated || !userId) {
		return <div>Redirecionando para login...</div>;
	}

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

	let dashboardContent: ReactNode = null;
	let needsToCreateCustomer = false;

	if (existingUser.role === 'admin') {
		const [shifts, appointments, createdPets, createdCustomers] =
			await Promise.all([
				getShifts(params.month, false),
				getAppointments(params.month, false),
				getCreatedPets(params.month),
				getCreatedCustomers(params.month),
			]);

		dashboardContent = (
			<DashboardCards
				shifts={shifts}
				appointments={appointments}
				createdPets={createdPets}
				createdCustomers={createdCustomers}
			/>
		);
	} else if (existingUser.role === 'doctor') {
		const [shifts, appointments] = await Promise.all([
			getShifts(params.month, false),
			getAppointments(params.month, false),
		]);

		dashboardContent = (
			<DoctorDashboard shifts={shifts} appointments={appointments} />
		);
	} else if (existingUser.role === 'customer') {
		const existingCustomer = await db.query.customersTable.findFirst({
			where: eq(customersTable.userId, existingUser.id),
		});

		needsToCreateCustomer = !existingCustomer;
	}

	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Dashboard</PageTitle>
				</PageHeaderContent>
			</PageHeader>

			<PageContent>
				<PageDescription>Olá, {existingUser.name}!</PageDescription>

				{dashboardContent}

				{needsToCreateCustomer && (
					<OnboardingCustomerFormDialog isOpen={needsToCreateCustomer} />
				)}
			</PageContent>
		</PageContainer>
	);
};

export default DashboardPage;

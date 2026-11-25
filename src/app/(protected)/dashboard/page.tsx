import { getDoctorDashboard } from '@/lib/dashboard/doctor-dashboard-queries';
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
import AdminDashboard from './_components/admin-dashboard';
import { getAdminDashboard } from '@/lib/dashboard/admin-dashboard-queries';
import DoctorDashboard from './_components/doctor-dashboard';
import CustomerDashboard from './_components/customer-dashboard';
import { getCustomerDashboard } from '@/lib/dashboard/customer-dashboard-queries';

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
		const data = await getAdminDashboard(params.month);
		dashboardContent = <AdminDashboard data={data} />;
	} else if (existingUser.role === 'doctor') {
		const data = await getDoctorDashboard(params.month);
		dashboardContent = <DoctorDashboard data={data} />;
	} else if (existingUser.role === 'customer') {
		const existingCustomer = await db.query.customersTable.findFirst({
			where: eq(customersTable.userId, existingUser.id),
		});

		needsToCreateCustomer = !existingCustomer;
		if (existingCustomer) {
			const data = await getCustomerDashboard();
			dashboardContent = <CustomerDashboard data={data} tutorName={existingUser.name} />;
		}
	}

	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Dashboard</PageTitle>
				</PageHeaderContent>
			</PageHeader>

			<PageContent>
				{(existingUser.role !== 'customer' || needsToCreateCustomer) && (
					<PageDescription>Olá, {existingUser.name}!</PageDescription>
				)}

				{dashboardContent}

				{needsToCreateCustomer && (
					<OnboardingCustomerFormDialog isOpen={needsToCreateCustomer} />
				)}
			</PageContent>
		</PageContainer>
	);
};

export default DashboardPage;

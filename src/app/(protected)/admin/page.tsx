import {
	PageContainer,
	PageContent,
	PageHeader,
	PageHeaderContent,
	PageTitle,
} from '@/components/shared/page-container';
import { db } from '@/db';
import { usersTable } from '@/db/schema';
import { getClerkEnvironment } from '@/lib/integrations/clerk-environment';
import { requireAdmin, requirePageAccess } from '@/lib/security/authorization';
import { asc, ilike, or } from 'drizzle-orm';
import AdminFormClient from './_components/admin-form';

const PAGE_SIZE = 20;

const AdminPage = async ({ searchParams }: { searchParams: Promise<{ filter?: string; page?: string }> }) => {
	const context = await requirePageAccess('/admin');
	requireAdmin(context);
	const environment = getClerkEnvironment();
	const params = await searchParams;
	const filter = typeof params.filter === 'string' ? params.filter.trim().slice(0, 120) : '';
	const requestedPage = Number(params.page);
	const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 10000) : 1;
	const users = await db.query.usersTable.findMany({
		columns: { id: true, name: true, email: true, role: true },
		with: { identities: { columns: { environment: true, clerkUserId: true } } },
		where: filter ? or(ilike(usersTable.name, `%${filter}%`), ilike(usersTable.email, `%${filter}%`)) : undefined,
		orderBy: [asc(usersTable.name), asc(usersTable.id)],
		limit: PAGE_SIZE + 1,
		offset: (page - 1) * PAGE_SIZE,
	});
	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Identidades Clerk</PageTitle>
				</PageHeaderContent>
			</PageHeader>
			<PageContent>
				<AdminFormClient
					environment={environment}
					users={users.slice(0, PAGE_SIZE)}
					filter={filter}
					page={page}
					hasNext={users.length > PAGE_SIZE}
				/>
			</PageContent>
		</PageContainer>
	);
};

export default AdminPage;

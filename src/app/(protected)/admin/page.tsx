import { ListSkeleton } from '@/components/list/list-skeleton';
import {
	PageContainer,
	PageContent,
	PageHeader,
	PageHeaderContent,
	PageTitle,
} from '@/components/shared/page-container';
import LoadingDialog from '@/components/ui/loading';
import { getClerkEnvironment } from '@/lib/integrations/clerk-environment';
import { Suspense } from 'react';
import AdminFormClient from './_components/admin-form';

const AdminPage = async () => {
	const environment = getClerkEnvironment();

	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Identidades Clerk</PageTitle>
				</PageHeaderContent>
			</PageHeader>

			<PageContent>
				<Suspense
					fallback={
						<>
							<ListSkeleton />
							<LoadingDialog />
						</>
					}
				></Suspense>

				<AdminFormClient environment={environment} />
			</PageContent>
		</PageContainer>
	);
};

export default AdminPage;

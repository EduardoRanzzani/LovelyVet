import {
	PageContainer,
	PageContent,
	PageHeader,
	PageHeaderContent,
	PageTitle,
} from '@/components/shared/page-container';
import { ListSkeleton } from '@/components/list/list-skeleton';
import LoadingDialog from '@/components/ui/loading';
import { requirePageAccess } from '@/lib/security/authorization';
import { Suspense } from 'react';
import EmailFormClient from './_components/email-form';
import WhatsappFormClient from './_components/whatsapp-form';

const EmailsPage = async () => {
	await requirePageAccess('/messages');

	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Testador de Email</PageTitle>
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
				>
					<EmailFormClient />

					<WhatsappFormClient />
				</Suspense>
			</PageContent>
		</PageContainer>
	);
};

export default EmailsPage;

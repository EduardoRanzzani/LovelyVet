import { getPetById } from '@/api/actions/pets.actions';
import { ListSkeleton } from '@/components/list/list-skeleton';
import {
	PageContainer,
	PageContent,
	PageHeader,
	PageHeaderContent,
	PageTitle,
} from '@/components/shared/page-container';
import LoadingDialog from '@/components/ui/loading';
import { Suspense } from 'react';
import RecipeLayoutPageClient from './_component/recipe';
import { getPrescriptionsItems } from '@/api/actions/prescriptions-items.actions';

const RecipeLayoutPage = async () => {
	const pet = await getPetById('d71a7d88-7326-4ad5-9b90-49ac1339d8ad');
	const prescriptionItems = await getPrescriptionsItems();

	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Modelo de Receita</PageTitle>
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
					<RecipeLayoutPageClient
						pet={pet}
						prescriptionItems={prescriptionItems}
					/>
				</Suspense>
			</PageContent>
		</PageContainer>
	);
};

export default RecipeLayoutPage;

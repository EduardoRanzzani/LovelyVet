import {
	PageContainer,
	PageContent,
	PageDescription,
	PageHeader,
	PageHeaderContent,
	PageTitle,
} from '@/components/shared/page-container';
import LoadingDialog from '@/components/ui/loading';
import { requirePageAccess } from '@/lib/security/authorization';
import { Suspense } from 'react';
import CalculatorPageForm from './_components/calculator-form';

const CalculatorPage = async () => {
	await requirePageAccess('/calculators');

	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Calculadoras</PageTitle>
				</PageHeaderContent>
			</PageHeader>

			<PageContent>
				<PageDescription>
					Diversas calculadoras de utilitários para facilitar o dia a dia
				</PageDescription>

				<Suspense
					fallback={
						<>
							<LoadingDialog />
						</>
					}
				>
					<CalculatorPageForm />
				</Suspense>
			</PageContent>
		</PageContainer>
	);
};

export default CalculatorPage;

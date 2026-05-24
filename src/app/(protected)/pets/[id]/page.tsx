import { getBreeds } from '@/api/actions/breeds.actions';
import { getCustomers } from '@/api/actions/customers.actions';
import { getPetById } from '@/api/actions/pets.actions';
import { getSpecies } from '@/api/actions/species.actions';
import {
	PageContainer,
	PageContent,
	PageHeader,
	PageHeaderContent,
	PageTitle,
} from '@/components/shared/page-container';
import LoadingDialog from '@/components/ui/loading';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import PetDetailsClient from '../_components/pet-details';
import { PetDetailsSkeleton } from '../_components/pet-details-skeleton';
import { getDoctors } from '@/api/actions/doctors.actions';

interface PetDetailsPageProps {
	params: Promise<{ id: string }>;
}

const PetDetailsPage = async ({ params }: PetDetailsPageProps) => {
	const { id } = await params;

	const pet = await getPetById(id);
	if (!pet) notFound();

	const doctors = await getDoctors();
	const speciesPromise = getSpecies();
	const breedsPromise = getBreeds();
	const customersPromise = getCustomers();

	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Detalhes de {pet.name}</PageTitle>
				</PageHeaderContent>
			</PageHeader>

			<PageContent>
				{/* <PageDescription>Detalhes do cadastro do pet</PageDescription> */}
				<Suspense
					fallback={
						<>
							<PetDetailsSkeleton />
							<LoadingDialog />
						</>
					}
				>
					<PetDetailsClient
						pet={pet}
						doctors={doctors}
						speciesPromise={speciesPromise}
						breedsPromise={breedsPromise}
						customersPromise={customersPromise}
					/>
				</Suspense>
			</PageContent>
		</PageContainer>
	);
};

export default PetDetailsPage;

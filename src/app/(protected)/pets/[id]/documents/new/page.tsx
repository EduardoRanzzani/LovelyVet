import { getPetById } from '@/api/actions/pets.actions';
import { formatAge } from '@/api/util';
import {
	PageContainer,
	PageContent,
	PageHeader,
	PageHeaderContent,
	PageTitle,
} from '@/components/shared/page-container';
import { Badge } from '@/components/ui/badge';
import { formatWeight } from '@/helpers/weight';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import ClinicalDocumentBuilder from './_components/clinical-document-builder';

interface NewClinicalDocumentPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function NewClinicalDocumentPage({
	params,
}: NewClinicalDocumentPageProps) {
	await connection();

	const context = await requireAuthContext();
	requireStaff(context);

	const { id } = await params;

	const pet = await getPetById(id);

	if (!pet) {
		notFound();
	}

	const latestWeight = pet.weightHistory?.[0]?.weightInGrams ?? null;

	const tutors = pet.petTutors
		.map(({ tutor }) => tutor.user.name)
		.filter(Boolean)
		.join(', ');

	const gender = pet.gender === 'male' ? 'Macho' : 'Fêmea';

	return (
		<PageContainer>
			<PageHeader>
				<PageHeaderContent>
					<PageTitle>Nova Receita / Encaminhamento</PageTitle>
				</PageHeaderContent>
			</PageHeader>

			<PageContent>
				<div className='rounded-xl border bg-card p-6'>
					<div className='flex flex-col gap-4'>
						<div className='flex flex-wrap items-center gap-3'>
							<h2 className='text-2xl font-semibold'>{pet.name}</h2>

							<Badge variant='outline'>{pet.breed.specie.name}</Badge>

							<Badge variant='outline'>{pet.breed.name}</Badge>
						</div>

						<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5'>
							<div>
								<p className='text-xs text-muted-foreground'>Tutor</p>
								<p className='font-medium'>{tutors || '-'}</p>
							</div>

							<div>
								<p className='text-xs text-muted-foreground'>Idade</p>
								<p className='font-medium'>
									{formatAge(new Date(`${pet.birthDate}T12:00:00`))}
								</p>
							</div>

							<div>
								<p className='text-xs text-muted-foreground'>Peso</p>
								<p className='font-medium'>{formatWeight(latestWeight)}</p>
							</div>

							<div>
								<p className='text-xs text-muted-foreground'>Sexo</p>
								<p className='font-medium'>{gender}</p>
							</div>

							<div>
								<p className='text-xs text-muted-foreground'>Pelagem</p>
								<p className='font-medium'>{pet.color}</p>
							</div>
						</div>
					</div>
				</div>

				<ClinicalDocumentBuilder />
			</PageContent>
		</PageContainer>
	);
}

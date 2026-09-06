import { getPrescriptionById } from '@/api/actions/prescriptions.actions';
import PrescriptionLayout from '../../_component/prescription-layout';

export default async function PrintRecipePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const recipeData = await getPrescriptionById(id);

	return (
		<PrescriptionLayout
			pet={recipeData.pet}
			prescriptionItems={recipeData.content}
			recipeDate={recipeData.createdAt}
		/>
	);
}

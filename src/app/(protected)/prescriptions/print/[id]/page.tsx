import { getPrescriptionById } from '@/api/actions/prescriptions.actions';
import PrescriptionLayout from '../../_component/prescription-layout';

export default async function PrintRecipePage({
	params,
}: {
	params: { id: string };
}) {
	const resolvedParams = await params;
	console.log(resolvedParams.id);

	const recipeData = await getPrescriptionById(resolvedParams.id);

	return (
		<PrescriptionLayout
			pet={recipeData?.pet}
			prescriptionItems={recipeData?.content}
			recipeDate={recipeData?.createdAt}
		/>
	);
}

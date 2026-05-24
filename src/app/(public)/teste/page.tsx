import { getPetById } from '@/api/actions/pets.actions';
import { getPrescriptionsItems } from '@/api/actions/prescriptions-items.actions';
import RecipeLayoutPageClient from './_component/recipe';

const RecipeLayoutPage = async () => {
	const pet = await getPetById('d71a7d88-7326-4ad5-9b90-49ac1339d8ad');
	const prescriptionItems = await getPrescriptionsItems();

	return (
		<RecipeLayoutPageClient pet={pet} prescriptionItems={prescriptionItems} />
	);
};

export default RecipeLayoutPage;

type VaccineIdentity = { id: string; petId: string } | null | undefined;

export const assertVaccineBelongsToPet = (
	vaccine: VaccineIdentity,
	petId: string,
) => {
	if (!vaccine || vaccine.petId !== petId) {
		throw new Error('Vacina não encontrada para este pet.');
	}
};

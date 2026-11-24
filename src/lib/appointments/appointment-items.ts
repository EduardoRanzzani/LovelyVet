/** Serviços gerais são compatíveis com qualquer espécie. Sem espécie conhecida, só eles são exibidos. */
export function filterServicesForSpecies<T extends { specieId: string | null }>(
	services: readonly T[],
	specieId: string | null | undefined,
): T[] {
	return services.filter((service) => service.specieId === null || service.specieId === specieId);
}

export type PriceLine = { quantity: number; unitPriceInCents: number; discountInCents: number };
export function totalForLine(line: PriceLine): number {
	if (!Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 999 ||
		!Number.isSafeInteger(line.unitPriceInCents) || line.unitPriceInCents < 0 ||
		!Number.isSafeInteger(line.discountInCents) || line.discountInCents < 0) {
		throw new Error('Quantidade, valor ou desconto inválido.');
	}
	const gross = line.quantity * line.unitPriceInCents;
	if (!Number.isSafeInteger(gross) || line.discountInCents > gross) {
		throw new Error('Desconto superior ao valor bruto.');
	}
	return gross - line.discountInCents;
}
export function totalForItems(lines: PriceLine[]): number {
	const total = lines.reduce((sum, line) => sum + totalForLine(line), 0);
	if (!Number.isSafeInteger(total) || total > 2_147_483_647) throw new Error('Total ultrapassa o limite permitido.');
	return total;
}

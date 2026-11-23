/**
 * Um registro retroativo não deve criar saldo devedor antigo.
 * O preço de catálogo é preservado separadamente em vaccines.priceAtApplicationInCents.
 * Data local é determinada pela data recebida no formulário (não convertida para UTC aqui).
 */
export function appointmentPriceForVaccination(
  applicationDate: Date,
  now: Date,
  catalogPriceInCents: number,
) {
  if (!Number.isSafeInteger(catalogPriceInCents) || catalogPriceInCents < 0) {
    throw new Error('Preço do serviço inválido.');
  }
  const historical =
    applicationDate.getFullYear() !== now.getFullYear() ||
    applicationDate.getMonth() !== now.getMonth() ||
    applicationDate.getDate() !== now.getDate();
  const itemPriceInCents = historical ? 0 : catalogPriceInCents;
  return { historical, itemPriceInCents, totalPriceInCents: itemPriceInCents };
}

export function vaccinationAppointmentNotes(serviceName: string, historical: boolean) {
  return historical
    ? `Vacinação registrada retroativamente: ${serviceName}. Sem cobrança automática.`
    : `Atendimento gerado pelo registro de vacinação: ${serviceName}. Pagamento não registrado.`;
}

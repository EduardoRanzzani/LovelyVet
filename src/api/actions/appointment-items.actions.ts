'use server';
import { db } from '@/db';
import { appointmentItemsTable, appointmentProductItemsTable, appointmentsTable, vaccinesTable } from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { requireAccessibleAppointment } from '@/lib/security/appointment-access';
import { totalForItems } from '@/lib/appointments/appointment-items';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import z from 'zod';

const line = z.object({
	id: z.uuid(),
	quantity: z.number().int().min(1).max(999),
	unitPriceInCents: z.number().int().min(0).max(100_000_000),
	discountInCents: z.number().int().min(0).max(100_000_000),
});
export const updateAppointmentItemsSchema = z.object({
	appointmentId: z.uuid(),
	services: z.array(line).max(100),
	products: z.array(line).max(100),
}).refine((v) => v.services.length + v.products.length > 0, 'Inclua ao menos um item.');

export const updateAppointmentItems = actionClient.schema(updateAppointmentItemsSchema).action(async ({ parsedInput }) => {
	const context = await requireAuthContext();
	requireStaff(context);
	await requireAccessibleAppointment(context, parsedInput.appointmentId);
	if (new Set(parsedInput.services.map((s) => s.id)).size !== parsedInput.services.length ||
		new Set(parsedInput.products.map((s) => s.id)).size !== parsedInput.products.length) {
		throw new Error('Itens duplicados não são permitidos: ajuste a quantidade.');
	}
	return db.transaction(async (tx) => {
		// Lock no banco impede dois editores de alterarem os mesmos itens simultaneamente.
		await tx.execute(sql`SELECT id FROM appointments WHERE id = ${parsedInput.appointmentId} FOR UPDATE`);
		const appointment = await tx.query.appointmentsTable.findFirst({
			where: eq(appointmentsTable.id, parsedInput.appointmentId),
			with: { pet: { with: { breed: true } } },
		});
		if (!appointment || (context.role === 'doctor' && appointment.doctorId !== context.doctorId) || appointment.isPaid || ['cancelled', 'no_show'].includes(appointment.status)) {
			throw new Error('Atendimento indisponível para edição financeira.');
		}
		const linkedVaccines = await tx.query.vaccinesTable.findMany({
			columns: { serviceId: true },
			where: eq(vaccinesTable.appointmentId, appointment.id),
		});
		const vaccineServices = new Set(linkedVaccines.map((v) => v.serviceId).filter((id): id is string => Boolean(id)));
		for (const id of vaccineServices) {
			const line = parsedInput.services.find((s) => s.id === id);
			if (!line || line.quantity !== 1) throw new Error('O serviço da vacina aplicada deve ser preservado com quantidade 1.');
		}
		const [services, products] = await Promise.all([
			parsedInput.services.length ? tx.query.servicesTable.findMany({ where: (t, { inArray }) => inArray(t.id, parsedInput.services.map((s) => s.id)) }) : Promise.resolve([]),
			parsedInput.products.length ? tx.query.productsTable.findMany({ where: (t, { inArray }) => inArray(t.id, parsedInput.products.map((s) => s.id)) }) : Promise.resolve([]),
		]);
		if (services.length !== parsedInput.services.length || products.length !== parsedInput.products.length) throw new Error('Há itens inexistentes no catálogo.');
		if (services.some((service) => service.specieId && service.specieId !== appointment.pet.breed.specieId)) throw new Error('Serviço incompatível com a espécie do paciente.');
		const productActiveIds = new Set(products.filter((p) => p.active).map((p) => p.id));
		const existingServices = await tx.query.appointmentItemsTable.findMany({ where: eq(appointmentItemsTable.appointmentId, appointment.id) });
		for (const vaccineId of vaccineServices) {
			const original = existingServices.find((item) => item.serviceId === vaccineId);
			const submitted = parsedInput.services.find((item) => item.id === vaccineId);
			if (!original || !submitted || submitted.unitPriceInCents !== original.priceAtTimeInCents || submitted.discountInCents !== original.discountInCents) {
				throw new Error('Valor da vacina clínica vinculada deve ser preservado.');
			}
		}
		const existingProducts = await tx.query.appointmentProductItemsTable.findMany({ where: eq(appointmentProductItemsTable.appointmentId, appointment.id) });
		for (const line of parsedInput.products) {
			if (!productActiveIds.has(line.id) && !existingProducts.some((p) => p.productId === line.id)) throw new Error('Produto inativo não pode ser adicionado.');
		}
		const totalPriceInCents = totalForItems([...parsedInput.services, ...parsedInput.products]);
		await tx.delete(appointmentItemsTable).where(eq(appointmentItemsTable.appointmentId, appointment.id));
		await tx.delete(appointmentProductItemsTable).where(eq(appointmentProductItemsTable.appointmentId, appointment.id));
		if (parsedInput.services.length) await tx.insert(appointmentItemsTable).values(parsedInput.services.map((line) => ({
			appointmentId: appointment.id, serviceId: line.id, quantity: line.quantity,
			priceAtTimeInCents: line.unitPriceInCents, discountInCents: line.discountInCents,
		})));
		if (parsedInput.products.length) await tx.insert(appointmentProductItemsTable).values(parsedInput.products.map((line) => ({
			appointmentId: appointment.id, productId: line.id, quantity: line.quantity,
			priceAtTimeInCents: line.unitPriceInCents, discountInCents: line.discountInCents,
		})));
		await tx.update(appointmentsTable).set({ totalPriceInCents, updatedAt: new Date() }).where(eq(appointmentsTable.id, appointment.id));
		return { success: true, totalPriceInCents };
	}).then((result) => {
		revalidatePath('/appointments');
		return result;
	});
});

'use server';
import { db } from '@/db';
import { appointmentChargesTable, appointmentsTable, chargePaymentsTable, petTutorsTable } from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext, type AuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { buildAppointmentAccessCondition } from '@/lib/security/appointment-access';
import {
	assertChargeableAppointment,
	assertTutorIsLinked,
	assertPaymentAmount,
	calculateChargeBalance,
} from '@/lib/finance/ledger';
import { and, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const uuid = z.uuid();
const createChargeSchema = z.object({ appointmentId: uuid, customerId: uuid });
const receivePaymentSchema = z.object({
	appointmentId: uuid,
	operationKey: uuid,
	amountInCents: z.number().int().positive(),
	method: z.enum(['pix', 'cash', 'credit_card', 'debit_card', 'transfer']),
});
const voidChargeSchema = z.object({ appointmentId: uuid });

async function lockAppointment(
	tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
	appointmentId: string,
	context: AuthContext,
) {
	// LOCK serializa criação, recebimentos e alterações dos itens para este atendimento.
	if (context.role === 'doctor') {
		if (!context.doctorId) throw new Error('Veterinária não encontrada');
		await tx.execute(
			sql`SELECT id FROM appointments WHERE id = ${appointmentId} AND doctor_id = ${context.doctorId} FOR UPDATE`,
		);
	} else {
		await tx.execute(sql`SELECT id FROM appointments WHERE id = ${appointmentId} FOR UPDATE`);
	}
	const [appointment] = await tx
		.select()
		.from(appointmentsTable)
		.where(and(eq(appointmentsTable.id, appointmentId), buildAppointmentAccessCondition(context)));
	if (!appointment) throw new Error('Atendimento não encontrado');
	return appointment;
}

export const createAppointmentCharge = actionClient.schema(createChargeSchema).action(async ({ parsedInput }) => {
	const context = await requireAuthContext();
	requireStaff(context);
	const result = await db.transaction(async (tx) => {
		const appointment = await lockAppointment(tx, parsedInput.appointmentId, context);
		const existing = await tx
			.select()
			.from(appointmentChargesTable)
			.where(eq(appointmentChargesTable.appointmentId, appointment.id));
		if (existing.length) throw new Error('Este atendimento já tem uma cobrança, inclusive se cancelada.');
		assertChargeableAppointment(appointment);
		const [tutor] = await tx
			.select({ customerId: petTutorsTable.customerId })
			.from(petTutorsTable)
			.where(
				and(eq(petTutorsTable.petId, appointment.petId), eq(petTutorsTable.customerId, parsedInput.customerId)),
			);
		assertTutorIsLinked(tutor ? [tutor] : [], parsedInput.customerId);
		const [charge] = await tx
			.insert(appointmentChargesTable)
			.values({
				appointmentId: appointment.id,
				customerId: parsedInput.customerId,
				totalInCents: appointment.totalPriceInCents,
				createdBy: context.userId,
			})
			.returning({ id: appointmentChargesTable.id });
		return { chargeId: charge.id };
	});
	revalidatePath('/appointments');
	return result;
});

export const recordChargePayment = actionClient.schema(receivePaymentSchema).action(async ({ parsedInput }) => {
	const context = await requireAuthContext();
	requireStaff(context);
	const result = await db.transaction(async (tx) => {
		const appointment = await lockAppointment(tx, parsedInput.appointmentId, context);
		const [charge] = await tx
			.select()
			.from(appointmentChargesTable)
			.where(eq(appointmentChargesTable.appointmentId, appointment.id));
		if (!charge || charge.status !== 'open') throw new Error('Cobrança não encontrada ou cancelada.');
		const [existing] = await tx
			.select()
			.from(chargePaymentsTable)
			.where(
				and(
					eq(chargePaymentsTable.chargeId, charge.id),
					eq(chargePaymentsTable.operationKey, parsedInput.operationKey),
				),
			);
		if (existing) {
			if (
				existing.source !== 'manual' ||
				existing.amountInCents !== parsedInput.amountInCents ||
				existing.method !== parsedInput.method
			)
				throw new Error('Chave de operação já utilizada com outros dados.');
			return { paymentId: existing.id, repeated: true };
		}
		const payments = await tx
			.select({ amountInCents: chargePaymentsTable.amountInCents })
			.from(chargePaymentsTable)
			.where(eq(chargePaymentsTable.chargeId, charge.id));
		const balance = calculateChargeBalance(charge.totalInCents, payments);
		assertPaymentAmount(balance.balanceInCents, parsedInput.amountInCents);
		const [payment] = await tx
			.insert(chargePaymentsTable)
			.values({
				chargeId: charge.id,
				operationKey: parsedInput.operationKey,
				amountInCents: parsedInput.amountInCents,
				method: parsedInput.method,
				source: 'manual',
				receivedBy: context.userId,
			})
			.returning({ id: chargePaymentsTable.id });
		if (balance.balanceInCents === parsedInput.amountInCents)
			await tx
				.update(appointmentsTable)
				.set({ isPaid: true, updatedAt: new Date() })
				.where(eq(appointmentsTable.id, appointment.id));
		return { paymentId: payment.id, repeated: false };
	});
	revalidatePath('/appointments');
	return result;
});

export const cancelAppointmentCharge = actionClient.schema(voidChargeSchema).action(async ({ parsedInput }) => {
	const context = await requireAuthContext();
	requireStaff(context);
	const result = await db.transaction(async (tx) => {
		const appointment = await lockAppointment(tx, parsedInput.appointmentId, context);
		const [charge] = await tx
			.select()
			.from(appointmentChargesTable)
			.where(eq(appointmentChargesTable.appointmentId, appointment.id));
		if (!charge || charge.status !== 'open') throw new Error('Cobrança não está aberta.');
		const payments = await tx
			.select({ id: chargePaymentsTable.id })
			.from(chargePaymentsTable)
			.where(eq(chargePaymentsTable.chargeId, charge.id));
		if (payments.length) throw new Error('Cobrança com recebimentos não pode ser cancelada.');
		await tx
			.update(appointmentChargesTable)
			.set({ status: 'void', voidedAt: new Date() })
			.where(eq(appointmentChargesTable.id, charge.id));
		return { success: true };
	});
	revalidatePath('/appointments');
	return result;
});

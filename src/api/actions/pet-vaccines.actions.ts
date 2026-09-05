'use server';
import { db } from '@/db';
import { vaccinesTable } from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { resolveClinicalDoctorId } from '@/lib/security/clinical-access';
import { revalidatePath } from 'next/cache';
import { createVaccineSchema } from '../schema/vaccine.schema';

export const insertVaccine = actionClient
	.schema(createVaccineSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		const doctorId = resolveClinicalDoctorId(context, parsedInput.doctorId);

		// Calcular nextDoseDate
		const nextDoseDateObj = new Date(parsedInput.applicationDate);
		nextDoseDateObj.setDate(
			nextDoseDateObj.getDate() + parsedInput.daysToNextDose,
		);

		const nextDoseDateStr = nextDoseDateObj;

		const values = {
			...(parsedInput.id && { id: parsedInput.id }),
			petId: parsedInput.petId,
			name: parsedInput.name,
			applicationDate: parsedInput.applicationDate,
			nextDoseDate: nextDoseDateStr,
			lotNumber: parsedInput.lotNumber ?? undefined,
			manufacturer: parsedInput.manufacturer ?? undefined,
			doctorId,
			createdAt: new Date(), // timestamp() aceita Date, mas date() não.
		};

		await db
			.insert(vaccinesTable)
			.values(values)
			.onConflictDoUpdate({
				target: vaccinesTable.id,
				set: {
					name: values.name,
					applicationDate: parsedInput.applicationDate,
					nextDoseDate: values.nextDoseDate,
					lotNumber: values.lotNumber,
					manufacturer: values.manufacturer,
					doctorId: values.doctorId,
				},
			});

		revalidatePath(`/pets/${parsedInput.petId}`);
	});

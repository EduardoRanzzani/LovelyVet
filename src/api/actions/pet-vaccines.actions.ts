'use server';
import { db } from '@/db';
import { careRemindersTable, petsTable, servicesTable, vaccinesTable } from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { resolveClinicalDoctorId } from '@/lib/security/clinical-access';
import { assertCanAccessPet } from '@/lib/security/pet-access';
import { assertVaccineBelongsToPet } from '@/lib/vaccines/vaccine-integrity';
import { revalidatePath } from 'next/cache';
import { createVaccineSchema } from '../schema/vaccine.schema';
import { addDays, addYears, format } from 'date-fns';
import { and, eq } from 'drizzle-orm';

export const insertVaccine = actionClient
	.schema(createVaccineSchema)
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		const doctorId = resolveClinicalDoctorId(context, parsedInput.doctorId);

		await assertCanAccessPet(context, parsedInput.petId);

		let nextDoseDate: Date | null = null;

		switch (parsedInput.nextDoseType) {
			case 'booster':
				nextDoseDate = addDays(
					parsedInput.applicationDate,
					parsedInput.daysToNextDose!,
				);
				break;

			case 'annual':
				nextDoseDate = addYears(parsedInput.applicationDate, 1);
				break;

			case 'none':
				nextDoseDate = null;
				break;
		}

		if (parsedInput.id && parsedInput.reminderId) {
			throw new Error(
				'Não é permitido editar uma vacina ao concluir um lembrete.',
			);
		}

		await db.transaction(async (tx) => {
			let vaccineService: { id: string; name: string } | undefined;
			if (parsedInput.serviceId) {
				const service = await tx.query.servicesTable.findFirst({
					columns: { id: true, name: true, isVaccine: true, specieId: true },
					where: eq(servicesTable.id, parsedInput.serviceId),
				});
				if (!service?.isVaccine) {
					throw new Error('Serviço de vacina inválido ou não encontrado.');
				}
				if (service.specieId) {
					const targetPet = await tx.query.petsTable.findFirst({
						where: eq(petsTable.id, parsedInput.petId),
						with: { breed: true },
					});
					if (!targetPet || targetPet.breed.specieId !== service.specieId) {
						throw new Error('Vacina não indicada para a espécie do paciente.');
					}
				}
				vaccineService = { id: service.id, name: service.name };
			}

			if (parsedInput.reminderId) {
				const reminder = await tx.query.careRemindersTable.findFirst({
					where: eq(careRemindersTable.id, parsedInput.reminderId),
				});

				if (!reminder) {
					throw new Error('Lembrete não encontrado.');
				}

				if (
					reminder.type !== 'vaccine' ||
					reminder.petId !== parsedInput.petId ||
					!reminder.sourceVaccineId
				) {
					throw new Error(
						'O lembrete não corresponde à vacinação deste paciente.',
					);
				}

				if (context.role === 'doctor' && reminder.doctorId !== doctorId) {
					throw new Error(
						'Você não possui permissão para concluir este lembrete.',
					);
				}

				if (reminder.status !== 'pending') {
					throw new Error('Este lembrete já foi finalizado.');
				}

				const [completedReminder] = await tx
					.update(careRemindersTable)
					.set({
						status: 'completed',
						completedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(
						and(
							eq(careRemindersTable.id, reminder.id),
							eq(careRemindersTable.petId, parsedInput.petId),
							eq(careRemindersTable.status, 'pending'),
						),
					)
					.returning({ id: careRemindersTable.id });

				if (!completedReminder) {
					throw new Error(
						'Este lembrete já foi finalizado por outra operação.',
					);
				}
			}

			if (parsedInput.id) {
				const existingVaccine = await tx.query.vaccinesTable.findFirst({
					columns: { id: true, petId: true },
					where: eq(vaccinesTable.id, parsedInput.id),
				});

				assertVaccineBelongsToPet(existingVaccine, parsedInput.petId);
			}

			const values = {
				...(parsedInput.id && { id: parsedInput.id }),
				petId: parsedInput.petId,
				serviceId: vaccineService?.id ?? null,
				name: vaccineService?.name ?? parsedInput.name,
				applicationDate: parsedInput.applicationDate,
				nextDoseDate,
				nextDoseType: parsedInput.nextDoseType,
				lotNumber: parsedInput.lotNumber || undefined,
				manufacturer: parsedInput.manufacturer || undefined,
				doctorId,
				createdAt: new Date(),
			};

			const [vaccine] = await tx
				.insert(vaccinesTable)
				.values(values)
				.onConflictDoUpdate({
					target: vaccinesTable.id,
					set: {
						name: values.name,
						serviceId: values.serviceId,
						applicationDate: values.applicationDate,
						nextDoseDate: values.nextDoseDate,
						nextDoseType: values.nextDoseType,
						lotNumber: values.lotNumber,
						manufacturer: values.manufacturer,
						doctorId: values.doctorId,
					},
				})
				.returning({ id: vaccinesTable.id });

			if (!vaccine) {
				throw new Error('Não foi possível salvar o registro de vacinação.');
			}

			/*
			 * Um vaccine é a origem de no máximo
			 * um care_reminder.
			 */
			const existingReminder = await tx.query.careRemindersTable.findFirst({
				where: eq(careRemindersTable.sourceVaccineId, vaccine.id),
			});

			/*
			 * Sem próxima dose:
			 * removemos apenas um reminder ainda pendente.
			 *
			 * completed/cancelled permanecem como histórico.
			 */
			if (!nextDoseDate) {
				if (existingReminder?.status === 'pending') {
					await tx
						.delete(careRemindersTable)
						.where(eq(careRemindersTable.id, existingReminder.id));
				}
				return;
			}

			const reminderData = {
				petId: parsedInput.petId,
				doctorId,
				type: 'vaccine' as const,
				title: `Vacina: ${values.name}`,
				dueDate: format(nextDoseDate, 'yyyy-MM-dd'),
				sourceVaccineId: vaccine.id,
			};

			/*
			 * Um reminder já concluído representa
			 * um fato histórico.
			 *
			 * Não o reabrimos caso alguém edite
			 * posteriormente o registro da vacina.
			 */
			if (existingReminder && existingReminder.status !== 'pending') {
				return;
			}

			if (existingReminder) {
				await tx
					.update(careRemindersTable)
					.set({ ...reminderData, updatedAt: new Date() })
					.where(eq(careRemindersTable.id, existingReminder.id));

				return;
			}

			await tx.insert(careRemindersTable).values({
				...reminderData,
				status: 'pending',
			});
		});

		revalidatePath(`/pets/${parsedInput.petId}`);
		revalidatePath('/agenda');
		revalidatePath('/dashboard');
	});

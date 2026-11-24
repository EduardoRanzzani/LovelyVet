'use server';
import { db } from '@/db';
import {
	appointmentChargesTable,
	appointmentItemsTable,
	appointmentsTable,
	careRemindersTable,
	petsTable,
	servicesTable,
	vaccinesTable,
} from '@/db/schema';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { resolveClinicalDoctorId } from '@/lib/security/clinical-access';
import { assertCanAccessPet } from '@/lib/security/pet-access';
import { assertVaccineBelongsToPet } from '@/lib/vaccines/vaccine-integrity';
import { revalidatePath } from 'next/cache';
import { createVaccineSchema } from '../schema/vaccine.schema';
import { addDays, addYears, format } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import {
	appointmentPriceForVaccination,
	vaccinationAppointmentNotes,
} from '@/lib/vaccines/vaccination-appointment';

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
			// Uma repetição da mesma submissão não cria outra dose nem outro atendimento.
			if (!parsedInput.id && parsedInput.operationKey) {
				const previouslySaved = await tx.query.vaccinesTable.findFirst({
					where: eq(vaccinesTable.operationKey, parsedInput.operationKey),
				});
				if (previouslySaved) {
					if (
						previouslySaved.petId !== parsedInput.petId ||
						previouslySaved.doctorId !== doctorId
					) {
						throw new Error('Identificador de operação já utilizado.');
					}
					return;
				}
			}

			let vaccineService:
				| {
						id: string;
						name: string;
						priceInCents: number;
						durationMinutes: number;
				  }
				| undefined;
			if (parsedInput.serviceId) {
				const service = await tx.query.servicesTable.findFirst({
					columns: {
						id: true,
						name: true,
						isVaccine: true,
						specieId: true,
						priceInCents: true,
						durationMinutes: true,
					},
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
				vaccineService = {
					id: service.id,
					name: service.name,
					priceInCents: service.priceInCents,
					durationMinutes: service.durationMinutes,
				};
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

				if (!reminder.appointmentId && parsedInput.appointmentId) {
					throw new Error('Este retorno ainda nao foi convertido em agendamento.');
				}
				if (reminder.appointmentId && !parsedInput.serviceId) {
                    throw new Error('Selecione o serviço de vacinação do agendamento.');
                }
                if (reminder.appointmentId && reminder.appointmentId !== parsedInput.appointmentId) {
					throw new Error('O reforco deve ser registrado no atendimento agendado.');
				}
				if (reminder.appointmentId) {
					const linked = await tx.query.appointmentsTable.findFirst({
						where: eq(appointmentsTable.id, reminder.appointmentId),
					});
					if (!linked || linked.status !== 'completed' || linked.petId !== parsedInput.petId || linked.doctorId !== doctorId) {
						throw new Error('Conclua o atendimento de reforco antes de registrar a dose.');
					}
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
					columns: {
						id: true,
						petId: true,
						appointmentId: true,
						serviceId: true,
					},
					where: eq(vaccinesTable.id, parsedInput.id),
				});

				assertVaccineBelongsToPet(existingVaccine, parsedInput.petId);
				if (
					existingVaccine?.appointmentId &&
					((parsedInput.appointmentId !== undefined &&
						parsedInput.appointmentId !== existingVaccine.appointmentId) ||
						parsedInput.serviceId !== existingVaccine.serviceId)
				) {
					throw new Error(
						'Altere o serviço ou vínculo pela tela do atendimento.',
					);
				}
			}

			const values = {
				...(parsedInput.id && { id: parsedInput.id }),
				petId: parsedInput.petId,
				serviceId: vaccineService?.id ?? null,
				...(!parsedInput.id &&
					parsedInput.operationKey && {
						operationKey: parsedInput.operationKey,
					}),
				...(!parsedInput.id &&
					vaccineService && {
						priceAtApplicationInCents: vaccineService.priceInCents,
					}),
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

			// Vacinas antigas sem serviço permanecem apenas no histórico clínico.
			// Edições não recriam nem recalculam preços históricos.
			if (!parsedInput.id && vaccineService) {
				const service = vaccineService;
				const { totalPriceInCents, itemPriceInCents, historical } =
					appointmentPriceForVaccination(
						parsedInput.applicationDate,
						new Date(),
						service.priceInCents,
					);
				let appointmentId: string;
				if (parsedInput.appointmentId) {
					// Nunca descobrir atendimento por data/nome: exigir vínculo explícito.
					const existingAppointment =
						await tx.query.appointmentsTable.findFirst({
							where: eq(appointmentsTable.id, parsedInput.appointmentId),
						});
					if (
						!existingAppointment ||
						existingAppointment.petId !== parsedInput.petId ||
						existingAppointment.doctorId !== doctorId ||
						['cancelled', 'no_show'].includes(existingAppointment.status)
					) {
						throw new Error(
							'Atendimento informado não pertence ao paciente e veterinário.',
						);
					}
					appointmentId = existingAppointment.id;
					const existingItem = await tx.query.appointmentItemsTable.findFirst({
						where: and(
							eq(appointmentItemsTable.appointmentId, appointmentId),
							eq(appointmentItemsTable.serviceId, service.id),
						),
					});
					if (!existingItem) {
						if (parsedInput.reminderId) {
							const linkedReminder = await tx.query.careRemindersTable.findFirst({
								where: eq(careRemindersTable.id, parsedInput.reminderId),
							});
							if (linkedReminder?.appointmentId) throw new Error('O servico de vacina nao corresponde ao atendimento convertido.');
						}
						const [issuedCharge] = await tx.select({id: appointmentChargesTable.id}).from(appointmentChargesTable).where(eq(appointmentChargesTable.appointmentId, appointmentId));
						if (issuedCharge) throw new Error('Não é permitido adicionar vacina a um atendimento já faturado.');
						if (existingAppointment.isPaid) {
							throw new Error(
								'Não é permitido adicionar serviço a um atendimento já pago.',
							);
						}
						await tx.insert(appointmentItemsTable).values({
							appointmentId,
							serviceId: service.id,
							priceAtTimeInCents: itemPriceInCents,
						});
					}
					await tx
						.update(appointmentsTable)
						.set({
							status: 'completed',
							...(!existingItem && {
								totalPriceInCents:
									existingAppointment.totalPriceInCents + itemPriceInCents,
							}),
							updatedAt: new Date(),
						})
						.where(eq(appointmentsTable.id, appointmentId));
				} else {
					const [newAppointment] = await tx
						.insert(appointmentsTable)
						.values({
							petId: parsedInput.petId,
							doctorId,
							scheduledAt: parsedInput.applicationDate,
							endsAt: new Date(
								parsedInput.applicationDate.getTime() +
									service.durationMinutes * 60_000,
							),
							status: 'completed',
							totalPriceInCents,
							isPaid: false,
							notes: vaccinationAppointmentNotes(service.name, historical),
						})
						.returning({ id: appointmentsTable.id });
					if (!newAppointment)
						throw new Error(
							'Não foi possível criar o atendimento da vacinação.',
						);
					appointmentId = newAppointment.id;
					await tx.insert(appointmentItemsTable).values({
						appointmentId,
						serviceId: service.id,
						priceAtTimeInCents: itemPriceInCents,
					});
				}
				await tx
					.update(vaccinesTable)
					.set({ appointmentId })
					.where(
						and(
							eq(vaccinesTable.id, vaccine.id),
							eq(vaccinesTable.petId, parsedInput.petId),
						),
					);
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
		revalidatePath('/appointments');
		revalidatePath('/dashboard');
	});

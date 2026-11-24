'use server';

import { db } from '@/db';
import {
        appointmentChargesTable,
        vaccinesTable,
        medicalRecordsTable,
        prescriptionsTable,
        clinicalDocumentsTable,
        appointmentItemsTable,
        appointmentsTable,
        careRemindersTable,
        calendarEventsTable,
        doctorsTable,
        petsTable,
        shiftsTable,
} from '@/db/schema';
import { toCents } from '@/lib/money/currency';
import { actionClient } from '@/lib/next-safe-action';
import { buildAvailableStarts } from '@/lib/scheduling/availability';
import { assertIntervalWithinDoctorWorkingHours } from '@/lib/scheduling/doctor-working-hours';
import { normalizeAppointmentStart } from '@/lib/scheduling/appointment-time';
import {
        buildAppointmentAccessCondition,
        requireAccessibleAppointment,
} from '@/lib/security/appointment-access';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireStaff } from '@/lib/security/authorization';
import { resolveRequestedDoctorId } from '@/lib/security/doctor-scope';
import { assertCanAccessPet } from '@/lib/security/pet-access';
import { normalizePagination } from '@/lib/pagination';
import { resolveShiftMonth } from '@/lib/shifts/shift-month';
import {
        addMinutes,
        addMonths,
        endOfMonth,
        startOfMonth,
        subMonths,
} from 'date-fns';
import {
        and,
        count,
        desc,
        eq,
        exists,
        gt,
        gte,
        ilike,
        isNull,
        lt,
        lte,
        ne,
        notInArray,
        or,
        sql,
} from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import z from 'zod';
import { MAX_PAGE_SIZE, monthNames, PaginatedData } from '../config/consts';
import {
        AppointmentListItem,
        AppointmentsWithRelations,
        createAppointmentSchema,
        getDoctorAvailabilitySchema,
} from '../schema/appointments.schema';

export const getAppointmentsPaginated = async (
        page: number = 1,
        limit: number = MAX_PAGE_SIZE,
        search?: string,
        month?: string,
): Promise<PaginatedData<AppointmentListItem>> => {
        const context = await requireAuthContext();
        const pagination = normalizePagination(page, limit);
        const selectedMonth = resolveShiftMonth(month);
        const start = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
        const end = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
        const monthCondition = and(
                gte(appointmentsTable.scheduledAt, start),
                lt(appointmentsTable.scheduledAt, end),
        );

        const searchCondition = search?.trim()
                ? exists(
                                db
                                        .select()
                                        .from(petsTable)
                                        .where(
                                                and(
                                                        eq(petsTable.id, appointmentsTable.petId),
                                                        ilike(petsTable.name, `%${search.trim()}%`),
                                                ),
                                        ),
                        )
                : undefined;

        const data = await db.query.appointmentsTable.findMany({
                where: (appointments) =>
                        and(
                                buildAppointmentAccessCondition(context, undefined, appointments),
                                gte(appointments.scheduledAt, start),
                                lt(appointments.scheduledAt, end),
                                searchCondition,
                        ),
                limit: pagination.limit,
                offset: pagination.offset,
                orderBy: desc(appointmentsTable.scheduledAt),
                with: {
                        pet: {
                                columns: { id: true, name: true },
                                with: {
                                        petTutors: {
                                                columns: {},
                                                with: {
                                                        tutor: {
                                                                columns: { id: true },
                                                                with: { user: { columns: { name: true } } },
                                                        },
                                                },
                                        },
                                },
                        },
                        doctor: {
                                columns: { id: true },
                                with: { user: { columns: { name: true } } },
                        },
                        items: { with: { service: true } },
                        productItems: { with: { product: true } },
                        careReminders: {
                                where: (reminder) => eq(reminder.status, 'pending'),
                                columns: { id: true, petId: true, title: true },
                                with: { sourceVaccine: { columns: { serviceId: true } } },
                        },
                },
        });

        const totalCountResult = await db
                .select({
                        value: count(),
                })
                .from(appointmentsTable)
                .innerJoin(petsTable, eq(appointmentsTable.petId, petsTable.id))
                .where(
                        and(
                                buildAppointmentAccessCondition(context),
                                monthCondition,
                                search?.trim()
                                        ? ilike(petsTable.name, `%${search.trim()}%`)
                                        : undefined,
                        ),
                );

        const totalCount = Number(totalCountResult[0]?.value ?? 0);
        const pageCount = Math.ceil(totalCount / pagination.limit);

        const safeData: AppointmentListItem[] = data.map((appointment) => ({
                ...appointment,
                linkedReminder: appointment.careReminders[0] ? {
                        id: appointment.careReminders[0].id,
                        petId: appointment.careReminders[0].petId,
                        title: appointment.careReminders[0].title,
                        serviceId: appointment.careReminders[0].sourceVaccine?.serviceId ?? null,
                } : null,
                doctor: {
                        id: appointment.doctor.id,
                        user: { name: appointment.doctor.user.name },
                },
                pet: {
                        id: appointment.pet.id,
                        name: appointment.pet.name,
                        petTutors: appointment.pet.petTutors
                                .filter(({ tutor }) => context.role !== 'customer' || tutor.id === context.customerId)
                                .map(({ tutor }) => ({ tutor: { id: tutor.id, user: { name: tutor.user.name } } })),
                },
        }));

        return {
                data: safeData,
                metadata: {
                        totalCount,
                        pageCount,
                        currentPage: pagination.page,
                        limit: pagination.limit,
                },
        };
};

export const getAllAppointments = async (): Promise<
        AppointmentsWithRelations[]
> => {
        const context = await requireAuthContext();

        requireStaff(context);

        const appointments = await db.query.appointmentsTable.findMany({
                where: (appointments) =>
                        buildAppointmentAccessCondition(context, undefined, appointments),
                with: {
                        pet: {
                                with: {
                                        petTutors: { with: { tutor: { with: { user: true } } } },
                                },
                        },
                        doctor: { with: { user: true } },
                        items: { with: { service: true } },
                        productItems: { with: { product: true } },
                },
        });

        return appointments as AppointmentsWithRelations[];
};

export const getAppointments = async (
        monthName?: string,
        extraMonths?: boolean,
): Promise<AppointmentsWithRelations[]> => {
        const context = await requireAuthContext();
        requireStaff(context);

        const now = new Date();
        const year = now.getFullYear();
        const monthIndex = monthName
                ? monthNames.indexOf(monthName.toLowerCase())
                : now.getMonth();

        const safeMonthIndex = monthIndex === -1 ? now.getMonth() : monthIndex;
        const referenceDate = new Date(year, safeMonthIndex, 1);

        let startRange = startOfMonth(referenceDate);
        let endRange = endOfMonth(referenceDate);

        if (extraMonths) {
                startRange = startOfMonth(subMonths(referenceDate, 1));
                endRange = endOfMonth(addMonths(referenceDate, 1));
        }

        const appointments = await db.query.appointmentsTable.findMany({
                where: (appointments) =>
                        and(
                                buildAppointmentAccessCondition(context, undefined, appointments),
                                lte(appointments.scheduledAt, endRange),
                                gte(appointments.scheduledAt, startRange),
                        ),
                with: {
                        pet: {
                                with: {
                                        petTutors: { with: { tutor: { with: { user: true } } } },
                                },
                        },
                        doctor: { with: { user: true } },
                        items: { with: { service: true } },
                        productItems: { with: { product: true } },
                },
        });

        return appointments as AppointmentsWithRelations[];
};

export const getDoctorAvailability = actionClient
        .schema(getDoctorAvailabilitySchema)
        .action(async ({ parsedInput }) => {
                const context = await requireAuthContext();

                const {
                        doctorId: requestedDoctorId,
                        serviceIds,
                        dayStart,
                        dayEnd,
                        appointmentId,
                } = parsedInput;

                const doctorId = resolveRequestedDoctorId(context, requestedDoctorId);

                const doctor = await db.query.doctorsTable.findFirst({
                        columns: {
                                id: true,
                                availableFromWeekDay: true,
                                availableToWeekDay: true,
                                availableFromTime: true,
                                availableToTime: true,
                        },
                        where: eq(doctorsTable.id, doctorId),
                });

                if (!doctor) {
                        throw new Error('Veterinário não encontrado.');
                }

                /*
                 * Não confiamos na duração enviada pelo navegador.
                 * Ela é sempre derivada dos serviços no banco.
                 */
                const servicesData = await db.query.servicesTable.findMany({
                        columns: {
                                id: true,
                                durationMinutes: true,
                        },
                        where: (table, { inArray }) => inArray(table.id, serviceIds),
                });

                if (servicesData.length !== new Set(serviceIds).size) {
                        throw new Error('Um ou mais serviços selecionados são inválidos.');
                }

                const durationMinutes = servicesData.reduce(
                        (total, service) => total + service.durationMinutes,
                        0,
                );

                if (durationMinutes <= 0) {
                        throw new Error('A duração dos serviços selecionados é inválida.');
                }

                /*
                 * Somente buscamos intervalos ocupados.
                 *
                 * Nenhuma informação privada é devolvida ao cliente:
                 * nem título de calendar_event,
                 * nem clínica,
                 * nem pet de outro atendimento.
                 */
                const [appointments, shifts, personalEvents] = await Promise.all([
                        db.query.appointmentsTable.findMany({
                                where: and(
                                        eq(appointmentsTable.doctorId, doctorId),
                                        lt(appointmentsTable.scheduledAt, dayEnd),
                                        or(
                                                gt(appointmentsTable.endsAt, dayStart),
                                                isNull(appointmentsTable.endsAt),
                                        ),
                                        notInArray(appointmentsTable.status, ['cancelled', 'no_show']),
                                        appointmentId ? ne(appointmentsTable.id, appointmentId) : undefined,
                                ),

                                columns: {
                                        id: true,
                                        scheduledAt: true,
                                        endsAt: true,
                                },

                                with: {
                                        items: {
                                                columns: {},
                                                with: { service: { columns: { durationMinutes: true } } },
                                        },
                                },
                        }),

                        db.query.shiftsTable.findMany({
                                where: and(
                                        eq(shiftsTable.doctorId, doctorId),
                                        lt(shiftsTable.startTime, dayEnd),
                                        gt(shiftsTable.endTime, dayStart),
                                ),

                                columns: {
                                        startTime: true,
                                        endTime: true,
                                },
                        }),

                        db.query.calendarEventsTable.findMany({
                                where: and(
                                        eq(calendarEventsTable.doctorId, doctorId),
                                        lt(calendarEventsTable.startTime, dayEnd),
                                        gt(calendarEventsTable.endTime, dayStart),
                                ),

                                columns: { startTime: true, endTime: true },
                        }),
                ]);

                const busyIntervals = [
                        ...appointments.map((appointment) => {
                                /*
                                 * endsAt já é preenchido pelos appointments
                                 * novos.
                                 *
                                 * Este fallback mantém a consulta robusta
                                 * caso algum registro legado apareça.
                                 */
                                const fallbackDuration =
                                        appointment.items.reduce(
                                                (total, item) => total + item.service.durationMinutes,
                                                0,
                                        ) || 30;

                                return {
                                        start: appointment.scheduledAt,
                                        end:
                                                appointment.endsAt ??
                                                addMinutes(appointment.scheduledAt, fallbackDuration),
                                };
                        }),

                        ...shifts.map((shift) => ({
                                start: shift.startTime,
                                end: shift.endTime,
                        })),

                        ...personalEvents.map((event) => ({
                                start: event.startTime,
                                end: event.endTime,
                        })),
                ].filter((interval) => interval.start < dayEnd && interval.end > dayStart);

                /*
                 * Mantemos os mesmos 5 minutos já usados
                 * pelo DateTimePicker atual.
                 */
                const availableStarts = buildAvailableStarts({
                        dayStart,
                        dayEnd,
                        durationMinutes,
                        doctor,
                        busyIntervals,
                });

                return {
                        doctorId,
                        serviceIds: [...serviceIds].sort(),
                        dayStart: dayStart.toISOString(),
                        dayEnd: dayEnd.toISOString(),
                        durationMinutes,
                        availableStarts,
                };
        });

export const upsertAppointment = actionClient
        .schema(createAppointmentSchema)
        .action(async ({ parsedInput }) => {
                const context = await requireAuthContext();

                const { id, sourceReminderId, services, ...data } = parsedInput;

                if (sourceReminderId) {
                        requireStaff(context);
                        if (id || data.status !== 'pending') {
                                throw new Error('A conversao deve criar um novo agendamento pendente.');
                        }
                }

                const doctorId = resolveRequestedDoctorId(context, data.doctorId);

                // Remove segundos e milissegundos antes de validar conflitos.
                const scheduledAt = normalizeAppointmentStart(data.scheduledAt);

                /*
                 * BOLA:
                 * customer só pode criar/alterar
                 * appointment utilizando um pet
                 * ao qual possui acesso.
                 */
                await assertCanAccessPet(context, data.petId);

                /*
                 * Em updates validamos também o
                 * appointment original.
                 */
                if (id) {
                        const existingAppointment = await requireAccessibleAppointment(
                                context,
                                id,
                        );
                        const charged = await db.query.appointmentChargesTable.findFirst({
                                where: eq(appointmentChargesTable.appointmentId, id),
                                columns: { id: true },
                        });
                        if (charged) throw new Error('Atendimento faturado não pode ser editado.');
                        const productItems = await db.query.appointmentProductItemsTable.findFirst({
                                where: (item, { eq }) => eq(item.appointmentId, id),
                        });
                        if (productItems) throw new Error('Este atendimento possui produtos. Altere os valores pelo editor de itens.');

                        // Tutores editam apenas pendentes; equipe pode editar também confirmados.
                        const editableStatuses = context.role === 'customer'
                                ? ['pending']
                                : ['pending', 'confirmed'];
                        if (!editableStatuses.includes(existingAppointment.status)) {
                                throw new Error('O status atual não permite editar este agendamento.');
                        }
                        if (data.status !== existingAppointment.status && context.role !== 'customer') {
                                throw new Error('Utilize as ações de status para alterar o estado do atendimento.');
                        }
                }

                try {
                        await db.transaction(async (tx) => {
                                // Trava o lembrete antes de criar o atendimento, prevenindo conversoes duplicadas.
                                let convertingReminder: typeof careRemindersTable.$inferSelect | undefined;
                                if (sourceReminderId) {
                                        await tx.execute(sql`SELECT id FROM care_reminders WHERE id = ${sourceReminderId} FOR UPDATE`);
                                        const reminder = await tx.query.careRemindersTable.findFirst({
                                                where: eq(careRemindersTable.id, sourceReminderId),
                                        });
                                        if (!reminder || reminder.type !== 'vaccine' || !reminder.sourceVaccineId ||
                                            reminder.status !== 'pending' || reminder.appointmentId ||
                                            reminder.petId !== data.petId || reminder.doctorId !== doctorId) {
                                                throw new Error('Este retorno nao esta disponivel para conversao.');
                                        }
                                        const origin = await tx.query.vaccinesTable.findFirst({
                                                where: eq(vaccinesTable.id, reminder.sourceVaccineId),
                                        });
                                        if (!origin || origin.petId !== data.petId) {
                                                throw new Error('A vacina de origem nao pertence ao paciente.');
                                        }
                                        if (origin.serviceId && (services.length !== 1 || services[0] !== origin.serviceId)) {
                                                throw new Error('O reforco deve utilizar o servico de vacina de origem.');
                                        }
                                        convertingReminder = reminder;
                                }
                                if (id) {
                                        // Bloqueia a linha antes de validar o estado efetivo do atendimento.
                                        await tx.execute(sql`SELECT id FROM appointments WHERE id = ${id} FOR UPDATE`);
                                        const lockedAppointment = await tx.query.appointmentsTable.findFirst({
                                                where: eq(appointmentsTable.id, id),
                                                columns: { id: true, status: true },
                                        });
                                        if (!lockedAppointment) {
                                                throw new Error('Agendamento não encontrado ou já removido.');
                                        }
                                        const editableStatuses = context.role === 'customer'
                                                ? ['pending']
                                                : ['pending', 'confirmed'];
                                        if (!editableStatuses.includes(lockedAppointment.status)) {
                                                throw new Error('O agendamento mudou de status e não pode mais ser editado.');
                                        }
                                        if (context.role !== 'customer' && data.status !== lockedAppointment.status) {
                                                throw new Error('O status mudou durante a edição. Atualize a página.');
                                        }
                                        // Protege inclusive contra cobranças e produtos criados após a validação inicial.
                                        const [charged, productItem] = await Promise.all([
                                                tx.query.appointmentChargesTable.findFirst({
                                                        where: eq(appointmentChargesTable.appointmentId, id),
                                                        columns: { id: true },
                                                }),
                                                tx.query.appointmentProductItemsTable.findFirst({
                                                        where: (item, { eq }) => eq(item.appointmentId, id),
                                                        columns: { id: true },
                                                }),
                                        ]);
                                        if (charged) throw new Error('Atendimento faturado não pode ser editado.');
                                        if (productItem) throw new Error('Este atendimento possui produtos. Altere os valores pelo editor de itens.');
                                        const linkedReminder = await tx.query.careRemindersTable.findFirst({
                                                where: eq(careRemindersTable.appointmentId, id),
                                                with: { sourceVaccine: { columns: { serviceId: true } } },
                                        });
                                        if (linkedReminder) {
                                                if (linkedReminder.petId !== data.petId || linkedReminder.doctorId !== doctorId ||
                                                    services.length !== 1 ||
                                                    (linkedReminder.sourceVaccine?.serviceId && services[0] !== linkedReminder.sourceVaccine.serviceId)) {
                                                        throw new Error('Este retorno permite apenas reagendar a mesma vacinacao.');
                                                }
                                        }
                                }
                                /*
                                 * Não confiamos em preço nem duração
                                 * enviados pelo browser.
                                 *
                                 * Os valores oficiais vêm dos serviços
                                 * armazenados no banco.
                                 */
                                const servicesData = await tx.query.servicesTable.findMany({
                                        where: (table, { inArray }) => inArray(table.id, services),
                                });

                                /*
                                 * Também impede IDs de serviços
                                 * inexistentes.
                                 *
                                 * new Set evita que duplicatas
                                 * no input burlem a comparação.
                                 */
                                if (servicesData.length !== new Set(services).size) {
                                        throw new Error('Um ou mais serviços selecionados são inválidos');
                                }

                                if (convertingReminder &&
                                    (servicesData.length !== 1 || !servicesData[0].isVaccine)) {
                                        throw new Error('Selecione um unico servico de vacinacao para este retorno.');
                                }

                                const servicesTotalInCents = servicesData.reduce(
                                        (total, service) => total + service.priceInCents,
                                        0,
                                );

                                /*
                                 * O formulário trabalha com reais, embora o campo ainda se chame
                                 * totalPriceInCents por compatibilidade com o código existente.
                                 *
                                 * Customer nunca controla o preço pelo payload.
                                 * Staff pode aplicar desconto, acréscimo ou valor negociado.
                                 */
                                const totalPriceInCents =
                                        context.role === 'customer'
                                                ? servicesTotalInCents
                                                : toCents(data.totalPriceInCents);

                                if (!Number.isSafeInteger(totalPriceInCents) || totalPriceInCents < 0) {
                                        throw new Error('O valor total do agendamento é inválido.');
                                }

                                /*
                                 * O término do atendimento é calculado
                                 * exclusivamente no backend.
                                 *
                                 * Dessa forma o cliente não consegue
                                 * manipular a duração pelo payload.
                                 */
                                const totalDurationMinutes = servicesData.reduce(
                                        (total, service) => total + service.durationMinutes,
                                        0,
                                );

                                if (totalDurationMinutes <= 0) {
                                        throw new Error('A duração total do atendimento é inválida');
                                }

                                const endsAt = addMinutes(scheduledAt, totalDurationMinutes);

                                const doctor = await tx.query.doctorsTable.findFirst({
                                        columns: {
                                                id: true,
                                                availableFromWeekDay: true,
                                                availableToWeekDay: true,
                                                availableFromTime: true,
                                                availableToTime: true,
                                        },
                                        where: eq(doctorsTable.id, doctorId),
                                });

                                if (!doctor) {
                                        throw new Error('Veterinário não encontrado.');
                                }

                                assertIntervalWithinDoctorWorkingHours(
                                        {
                                                start: scheduledAt,
                                                end: endsAt,
                                        },
                                        doctor,
                                );

                                /*
                                 * Serializa alterações da agenda
                                 * deste veterinário.
                                 *
                                 * Sem isso duas requisições concorrentes
                                 * poderiam consultar a disponibilidade
                                 * simultaneamente e ambas inserir
                                 * appointments no mesmo intervalo.
                                 *
                                 * O lock dura somente até o término
                                 * desta transaction.
                                 */
                                await tx.execute(sql`
                                        SELECT pg_advisory_xact_lock(
                                                hashtext('lovelyvet:doctor_schedule'),
                                                hashtext(${doctorId})
                                        )
                                `);

                                /*
                                 * Customer nunca controla
                                 * diretamente o status.
                                 */
                                const status = context.role === 'customer' ? 'pending' : data.status;

                                /*
                                 * Evitamos espalhar diretamente
                                 * todo parsedInput na tabela.
                                 *
                                 * Isso reduz mass assignment.
                                 */
                                const appointmentData = {
                                        petId: data.petId,
                                        doctorId,
                                        scheduledAt,
                                        endsAt,
                                        status,
                                        notes: data.notes,
                                        totalPriceInCents,
                                };

                                /*
                                 * Um intervalo conflita quando:
                                 *
                                 * existingStart < requestedEnd
                                 * &&
                                 * existingEnd > requestedStart
                                 *
                                 * Portanto:
                                 *
                                 * 08:00 - 08:30
                                 * 08:30 - 09:00
                                 *
                                 * é permitido.
                                 *
                                 * Enquanto:
                                 *
                                 * 08:00 - 08:30
                                 * 08:20 - 09:00
                                 *
                                 * é conflito.
                                 */
                                const appointmentConflict = await tx.query.appointmentsTable.findFirst({
                                        columns: {
                                                id: true,
                                        },
                                        where: and(
                                                eq(appointmentsTable.doctorId, doctorId),
                                                lt(appointmentsTable.scheduledAt, endsAt),
                                                gt(appointmentsTable.endsAt, scheduledAt),
                                                notInArray(appointmentsTable.status, ['cancelled', 'no_show']),
                                                id ? ne(appointmentsTable.id, id) : undefined,
                                        ),
                                });

                                if (appointmentConflict) {
                                        throw new Error(
                                                'O horário selecionado não está disponível para este veterinário.',
                                        );
                                }

                                /*
                                 * Um plantão ocupa o intervalo inteiro.
                                 *
                                 * Não revelamos detalhes do plantão
                                 * para quem está tentando realizar
                                 * um agendamento.
                                 */
                                const shiftConflict = await tx.query.shiftsTable.findFirst({
                                        columns: {
                                                id: true,
                                        },
                                        where: and(
                                                eq(shiftsTable.doctorId, doctorId),
                                                lt(shiftsTable.startTime, endsAt),
                                                gt(shiftsTable.endTime, scheduledAt),
                                        ),
                                });

                                if (shiftConflict) {
                                        throw new Error(
                                                'O horário selecionado não está disponível para este veterinário.',
                                        );
                                }

                                /*
                                 * Compromissos pessoais também
                                 * bloqueiam o intervalo.
                                 *
                                 * Retornamos somente indisponibilidade,
                                 * nunca título ou descrição do evento.
                                 */
                                const calendarEventConflict =
                                        await tx.query.calendarEventsTable.findFirst({
                                                columns: {
                                                        id: true,
                                                },
                                                where: and(
                                                        eq(calendarEventsTable.doctorId, doctorId),
                                                        lt(calendarEventsTable.startTime, endsAt),
                                                        gt(calendarEventsTable.endTime, scheduledAt),
                                                ),
                                        });

                                if (calendarEventConflict) {
                                        throw new Error(
                                                'O horário selecionado não está disponível para este veterinário.',
                                        );
                                }

                                let appointmentId: string | null = null;

                                if (id) {
                                        await tx
                                                .update(appointmentsTable)
                                                .set({
                                                        ...appointmentData,
                                                        updatedAt: new Date(),
                                                })
                                                .where(eq(appointmentsTable.id, id));

                                        appointmentId = id;

                                        await tx
                                                .delete(appointmentItemsTable)
                                                .where(eq(appointmentItemsTable.appointmentId, id));
                                } else {
                                        const [newAppointment] = await tx
                                                .insert(appointmentsTable)
                                                .values(appointmentData)
                                                .returning({
                                                        id: appointmentsTable.id,
                                                });

                                        if (!newAppointment) {
                                                throw new Error('Erro ao criar agendamento');
                                        }

                                        appointmentId = newAppointment.id;
                                }

                                /*
                                 * services é nonempty no schema,
                                 * mas mantemos a guarda também
                                 * para deixar a operação explícita.
                                 */
                                if (convertingReminder && appointmentId) {
                                        const [linked] = await tx.update(careRemindersTable)
                                                .set({ appointmentId, updatedAt: new Date() })
                                                .where(and(
                                                        eq(careRemindersTable.id, convertingReminder.id),
                                                        eq(careRemindersTable.status, 'pending'),
                                                        isNull(careRemindersTable.appointmentId),
                                                )).returning({ id: careRemindersTable.id });
                                        if (!linked) throw new Error('Este retorno ja foi convertido por outra operacao.');
                                }

                                if (appointmentId && servicesData.length > 0) {
                                        const itemsToInsert = servicesData.map((service) => ({
                                                appointmentId,
                                                serviceId: service.id,
                                                priceAtTimeInCents: service.priceInCents,
                                        }));

                                        await tx.insert(appointmentItemsTable).values(itemsToInsert);
                                }
                        });

                        revalidatePath('/appointments');
                        if (sourceReminderId) revalidatePath('/agenda');

                        return {
                                success: true,
                        };
                } catch (error: unknown) {
                        console.error('Erro no upsert:', error);

                        if (error instanceof Error) {
                                throw error;
                        }

                        throw new Error('Ocorreu um erro inesperado ao salvar o agendamento.');
                }
        });

export const deleteAppointment = actionClient
        .schema(
                z.object({
                        id: z.uuid(),
                }),
        )
        .action(async ({ parsedInput }) => {
                const context = await requireAuthContext();

                requireStaff(context);

                const appointment = await requireAccessibleAppointment(
                        context,
                        parsedInput.id,
                );

                if (!appointment) {
                        throw new Error('Agendamento não encontrado');
                }

                // Uma exclusão não pode apagar o histórico clínico nem o financeiro.
                // A trava impede que outra operação emita uma cobrança durante esta exclusão.
                await db.transaction(async (tx) => {
                        await tx.execute(sql`SELECT id FROM appointments WHERE id = ${parsedInput.id} FOR UPDATE`);

                        const [charge, vaccine, record, prescription, document] = await Promise.all([
                                tx.query.appointmentChargesTable.findFirst({
                                        where: eq(appointmentChargesTable.appointmentId, parsedInput.id),
                                        columns: { id: true },
                                }),
                                tx.query.vaccinesTable.findFirst({
                                        where: eq(vaccinesTable.appointmentId, parsedInput.id),
                                        columns: { id: true },
                                }),
                                tx.query.medicalRecordsTable.findFirst({
                                        where: eq(medicalRecordsTable.appointmentId, parsedInput.id),
                                        columns: { id: true },
                                }),
                                tx.query.prescriptionsTable.findFirst({
                                        where: eq(prescriptionsTable.appointmentId, parsedInput.id),
                                        columns: { id: true },
                                }),
                                tx.query.clinicalDocumentsTable.findFirst({
                                        where: eq(clinicalDocumentsTable.appointmentId, parsedInput.id),
                                        columns: { id: true },
                                }),
                        ]);

                        if (charge) {
                                throw new Error('Este atendimento possui histórico financeiro, mesmo que a cobrança esteja cancelada. A exclusão física não é permitida.');
                        }
                        if (vaccine || record || prescription || document) {
                                throw new Error('Este atendimento está vinculado ao histórico clínico do pet. Revise os registros clínicos antes de solicitar uma correção.');
                        }

                        await tx.delete(appointmentsTable).where(eq(appointmentsTable.id, parsedInput.id));
                });

                revalidatePath('/appointments');
        });

export const markAsConfirmed = actionClient
        .schema(
                z.object({
                        id: z.uuid(),
                }),
        )
        .action(async ({ parsedInput }) => {
                const context = await requireAuthContext();

                requireStaff(context);

                const appointment = await requireAccessibleAppointment(
                        context,
                        parsedInput.id,
                );

                if (appointment.status !== 'pending') {
                        throw new Error('Apenas agendamentos pendentes podem ser confirmados');
                }

                const updated = await db
                        .update(appointmentsTable)
                        .set({
                                status: 'confirmed',
                                updatedAt: new Date(),
                        })
                        .where(and(
                                eq(appointmentsTable.id, parsedInput.id),
                                eq(appointmentsTable.status, 'pending'),
                        ))
                        .returning({ id: appointmentsTable.id });

                if (updated.length !== 1) {
                        throw new Error('O agendamento foi alterado por outra operação. Atualize a página e tente novamente.');
                }

                revalidatePath('/appointments');
        });

export const markAppointmentAsCompleted = actionClient
        .schema(
                z.object({
                        id: z.uuid(),
                }),
        )
        .action(async ({ parsedInput }) => {
                const context = await requireAuthContext();

                requireStaff(context);

                const appointment = await requireAccessibleAppointment(
                        context,
                        parsedInput.id,
                );

                if (
                        appointment.status !== 'confirmed' &&
                        appointment.status !== 'in_progress'
                ) {
                        throw new Error(
                                'O agendamento precisa estar confirmado ou em atendimento para ser concluído',
                        );
                }

                const updated = await db
                        .update(appointmentsTable)
                        .set({
                                status: 'completed',
                                updatedAt: new Date(),
                        })
                        .where(and(
                                eq(appointmentsTable.id, parsedInput.id),
                                or(
                                        eq(appointmentsTable.status, 'confirmed'),
                                        eq(appointmentsTable.status, 'in_progress'),
                                ),
                        ))
                        .returning({ id: appointmentsTable.id });

                if (updated.length !== 1) {
                        throw new Error('O status do atendimento mudou. Atualize a página antes de concluí-lo.');
                }

                // Somente retornos convertidos abrem automaticamente o registro da nova dose.
                const reminder = await db.query.careRemindersTable.findFirst({
                        where: and(
                                eq(careRemindersTable.appointmentId, parsedInput.id),
                                eq(careRemindersTable.status, 'pending'),
                        ),
                        with: { sourceVaccine: { columns: { serviceId: true } } },
                });
                revalidatePath('/appointments');
                if (!reminder) return { vaccineFlow: null };
                return {
                        vaccineFlow: {
                                petId: reminder.petId,
                                reminderId: reminder.id,
                                appointmentId: parsedInput.id,
                                doctorId: reminder.doctorId,
                                vaccineName: reminder.title.replace(/^Vacina:\s*/, ''),
                                serviceId: reminder.sourceVaccine?.serviceId ?? undefined,
                        },
                };
        });

export const markAppointmentAsCancelled = actionClient
        .schema(
                z.object({
                        id: z.uuid(),
                }),
        )
        .action(async ({ parsedInput }) => {
                const context = await requireAuthContext();

                const appointment = await requireAccessibleAppointment(
                        context,
                        parsedInput.id,
                );

                if (appointment.status !== 'pending') {
                        throw new Error('Apenas agendamentos pendentes podem ser cancelados');
                }

                await db.transaction(async (tx) => {
                        const updated = await tx
                                .update(appointmentsTable)
                                .set({ status: 'cancelled', updatedAt: new Date() })
                                .where(and(
                                        eq(appointmentsTable.id, parsedInput.id),
                                        eq(appointmentsTable.status, 'pending'),
                                ))
                                .returning({ id: appointmentsTable.id });
                        if (updated.length !== 1) {
                                throw new Error('O agendamento foi alterado por outra operação e não pode mais ser cancelado.');
                        }
                        // Ao cancelar o atendimento, o retorno volta a ser uma pendencia clinica.
                        await tx.update(careRemindersTable)
                                .set({ appointmentId: null, updatedAt: new Date() })
                                .where(and(
                                        eq(careRemindersTable.appointmentId, parsedInput.id),
                                        eq(careRemindersTable.status, 'pending'),
                                ));
                });

                revalidatePath('/appointments');
                revalidatePath('/agenda');
        });

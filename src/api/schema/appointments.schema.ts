import {
	appointmentItemsTable,
	appointmentsTable,
	customersTable,
	doctorsTable,
	petsTable,
	servicesTable,
	usersTable,
} from '@/db/schema';
import z from 'zod';

export type AppointmentsWithRelations =
	typeof appointmentsTable.$inferSelect & {
		pet: typeof petsTable.$inferSelect & {
			petTutors: {
				tutor: typeof customersTable.$inferSelect & {
					user: typeof usersTable.$inferSelect;
				};
			}[];
		};
		doctor: typeof doctorsTable.$inferSelect & {
			user: typeof usersTable.$inferSelect;
		};
		items: (typeof appointmentItemsTable.$inferSelect & {
			service: typeof servicesTable.$inferSelect;
		})[];
	};

export const createAppointmentSchema = z.object({
	id: z.uuid().optional().nullable(),
	petId: z.uuid().nonempty({ message: 'Selecione o pet' }),
	doctorId: z.uuid().nonempty({ message: 'Selecione o veterinário' }),
	scheduledAt: z.date('A data e hora são obrigatórias'),
	status: z
		.enum([
			'pending',
			'confirmed',
			'in_progress',
			'completed',
			'cancelled',
			'no_show',
		])
		.nonoptional({ message: 'O status é obrigatório' }),
	totalPriceInCents: z.number().min(0, 'O preço não pode ser negativo'),
	notes: z.string().optional().nullable(),
	services: z.array(z.uuid()).nonempty({ message: 'Selecione o serviço' }),
});

export type CreateAppointmentSchema = z.infer<typeof createAppointmentSchema>;

export type AppointmentListItem = Omit<
	AppointmentsWithRelations,
	'doctor' | 'pet'
> & {
	doctor: {
		id: string;
		user: { name: string };
	};
	pet: {
		id: string;
		name: string;
		petTutors: { tutor: { user: { name: string } } }[];
	};
};

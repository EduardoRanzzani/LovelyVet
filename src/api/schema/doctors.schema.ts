import { doctorsTable, usersTable } from '@/db/schema';
import z from 'zod';

export const weekDaySchema = z.enum(['0', '1', '2', '3', '4', '5', '6'], {
	message: 'Dia da semana inválido',
});

export type WeekDayValue = z.infer<typeof weekDaySchema>;

const timeSchema = z
	.string()
	.regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido');

export type DoctorsWithRelations = typeof doctorsTable.$inferSelect & {
	user: typeof usersTable.$inferSelect;
};

export type DoctorOption = {
	id: string;
	user: {
		name: string;
	};
};

export const createDoctorWithUserSchema = z
	.object({
		id: z.uuid().optional().nullable(),
		name: z.string().nonempty({ message: 'O campo Nome é obrigatório' }),
		email: z.string().nonempty({ message: 'O campo Email é obrigatório' }),
		image: z.string().optional(),
		phone: z.string().nonempty({ message: 'O campo Telefone é obrigatório' }),
		cpf: z.string().nonempty({ message: 'O campo CPF é obrigatório' }),
		gender: z
			.enum(['male', 'female'])
			.nonoptional({ message: 'O campo Sexo é obrigatório' }),
		licenseNumber: z
			.string()
			.nonempty({ message: 'O campo CRMV é obrigatório' }),
		licenseState: z.string().nonempty({ message: 'O campo UF é obrigatório' }),
		specialty: z
			.string()
			.nonempty({ message: 'O campo Especialidade é obrigatório' }),
		availableFromWeekDay: weekDaySchema,
		availableToWeekDay: weekDaySchema,
		availableFromTime: timeSchema,
		availableToTime: timeSchema,
	})
	.refine((data) => data.availableFromTime < data.availableToTime, {
		message: 'O horário de término deve ser posterior ao horário de início',
		path: ['availableToTime'],
	});

export type CreateDoctorWithUserSchema = z.infer<
	typeof createDoctorWithUserSchema
>;

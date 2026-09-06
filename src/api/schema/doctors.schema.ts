import { doctorsTable, usersTable } from '@/db/schema';
import z from 'zod';

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
		userId: z.string().optional().nullable(),
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
		availableFromWeekDay: z.string(),
		availableToWeekDay: z.string(),
		availableFromTime: z.string().nonempty({
			message: 'Hora de início da consulta é obrigatório',
		}),
		availableToTime: z.string().nonempty({
			message: 'Hora de término da consulta é obrigatório',
		}),
	})
	.refine(
		(data) => {
			return data.availableFromTime < data.availableToTime;
		},
		{
			message: 'Hora de início não pode ser anterior à hora de término',
			path: ['availableToTime'],
		},
	);

export type CreateDoctorWithUserSchema = z.infer<
	typeof createDoctorWithUserSchema
>;

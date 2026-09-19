import { doctorsTable, shiftsTable, usersTable } from '@/db/schema';
import z from 'zod';

export type ShiftsWithRelations = typeof shiftsTable.$inferSelect & {
	doctor: typeof doctorsTable.$inferSelect & {
		user: typeof usersTable.$inferSelect;
	};
};

export const createShiftSchema = z.object({
	id: z.string().uuid().optional(),
	doctorId: z
		.string()
		.uuid({ message: 'O campo veterinário é obrigatório' })
		.min(1, 'O campo veterinário é obrigatório'),
	clinicId: z.string().uuid({ message: 'O campo clínica é obrigatório' }),
	startTime: z.date({ message: 'Data de início é obrigatória' }),
	// .refine((date) => date >= new Date(new Date().setSeconds(0, 0)), {
	// 	message: 'A data de início não pode ser anterior ao horário atual',
	// }),
	duration: z.string().min(1, 'Mínimo 1h'),
	requesterName: z.string().optional(),
	amountInCents: z.number().optional(),
	isPaid: z.boolean({ message: 'Selecione uma das opções' }),
});

export type CreateShiftSchema = z.infer<typeof createShiftSchema>;

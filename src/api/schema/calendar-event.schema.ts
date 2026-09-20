import { z } from 'zod';

export const createCalendarEventSchema = z
	.object({
		id: z.string().uuid().optional(),
		doctorId: z.string().uuid({
			message: 'O veterinário é obrigatório',
		}),
		title: z
			.string()
			.trim()
			.min(2, 'Informe o compromisso')
			.max(150, 'O título deve ter no máximo 150 caracteres'),
		startTime: z.date({
			message: 'Data/hora de início é obrigatória',
		}),
		endTime: z.date({
			message: 'Data/hora de término é obrigatória',
		}),
		notes: z
			.string()
			.trim()
			.max(2000, 'As observações devem ter no máximo 2000 caracteres')
			.optional(),
	})
	.superRefine((data, ctx) => {
		if (data.endTime <= data.startTime) {
			ctx.addIssue({
				code: 'custom',
				path: ['endTime'],
				message: 'O término deve ser posterior ao início',
			});
		}
	});

export const getCalendarEventAvailabilitySchema = z
	.object({
		doctorId: z.string().uuid(),
		dayStart: z.date(),
		dayEnd: z.date(),
		durationMinutes: z.number().int().positive(),
		eventId: z.string().uuid().optional().nullable(),
	})
	.superRefine((data, ctx) => {
		if (data.dayEnd <= data.dayStart) {
			ctx.addIssue({
				code: 'custom',
				path: ['dayEnd'],
				message: 'Período inválido',
			});
		}
	});

export type CreateCalendarEventSchema = z.infer<
	typeof createCalendarEventSchema
>;

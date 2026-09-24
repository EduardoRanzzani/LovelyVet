import z from 'zod';

export const createNoteSchema = z.object({
	petId: z.uuid({ message: 'O paciente é obrigatório' }),
	content: z.string().nonempty({ message: 'O campo content é obrigatório' }),
});

export type CreateNoteSchema = z.infer<typeof createNoteSchema>;

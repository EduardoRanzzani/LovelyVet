import { JSX } from 'react';
import z from 'zod';

/** Dados de `users` para avatar e legenda (author ou user do médico). */
export type TimelineItemPerson = {
	name: string;
	email?: string | null;
	image?: string | null;
};

export function toTimelinePerson(user: {
	name: string;
	email?: string | null;
	image?: string | null;
}): TimelineItemPerson {
	return {
		name: user.name,
		email: user.email ?? null,
		image: user.image ?? null,
	};
}

export interface TimelineItem {
	type:
		| 'record'
		| 'prescription'
		| 'weight'
		| 'appointment'
		| 'vaccine'
		| 'pathology'
		| 'attachment'
		| 'note';
	id?: string;
	date: Date;
	title: string;
	/** Nome exibido como subtítulo (ex.: responsável pelo registro). */
	doctor?: string;
	/** Quem aparece no avatar: author quando existir; caso contrário user do médico. */
	avatarPerson?: TimelineItemPerson;
	content: string | JSX.Element;
	icon: React.ReactNode;
	color: string;
}

export const timelineItemSchema = z.object({
	type: z.enum(
		[
			'record',
			'prescription',
			'weight',
			'appointment',
			'vaccine',
			'pathology',
			'attachment',
			'note',
		],
		{
			message: 'Tipo inválido',
		},
	),
	id: z.string({
		message: 'ID é obrigatório',
	}),
	date: z.coerce.date().optional(),
	title: z.string().optional(),
	doctor: z.string().optional(),
	content: z.string().optional(),
	icon: z.any().optional(),
	color: z.string().optional(),
	petId: z.string({ message: 'ID do pet é obrigatório' }),
});

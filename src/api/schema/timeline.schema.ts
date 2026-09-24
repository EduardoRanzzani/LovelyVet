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
		| 'referral'
		| 'exam_request'
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
	canDelete?: boolean;
}

export const deletableTimelineItemTypes = [
	'prescription',
	'referral',
	'exam_request',
	'weight',
	'vaccine',
	'note',
] as const;

export type DeletableTimelineItemType =
	(typeof deletableTimelineItemTypes)[number];

export const deleteTimelineItemSchema = z.object({
	type: z.enum(deletableTimelineItemTypes, {
		message: 'Tipo de item inválido para exclusão',
	}),
	id: z.uuid({ message: 'ID do item inválido' }),
	petId: z.uuid({ message: 'ID do pet inválido' }),
});

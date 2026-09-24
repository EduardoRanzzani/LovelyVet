import { clinicsTable } from '@/db/schema';
import { z } from 'zod';

export type Clinics = typeof clinicsTable.$inferSelect;

export type ClinicShiftOption = Pick<
	Clinics,
	'id' | 'name' | 'defaultShiftPriceInCents' | 'isActive'
>;

export const createClinicSchema = z.object({
	id: z.uuid().optional().nullable(),
	name: z.string().nonempty({ message: 'O nome da clínica é obrigatório' }),
	phone: z
		.string()
		.nonempty({ message: 'O telefone da clínica é obrigatório' }),
	defaultShiftPriceInCents: z
		.number({ message: 'Valor do plantão é obrigatório' })
		.finite({ message: 'Valor do plantão inválido' })
		.positive({ message: 'O valor do plantão deve ser maior que zero' }),
	isActive: z.boolean(),
	postalCode: z.string().nonempty({ message: 'O campo CEP é obrigatório' }),
	address: z.string().nonempty({ message: 'O campo endereço é obrigatório' }),
	addressNumber: z.string().optional(),
	neighborhood: z
		.string()
		.nonempty({ message: 'O campo bairro é obrigatório' }),
	city: z.string().nonempty({ message: 'O campo cidade é obrigatório' }),
	state: z.string().nonempty({ message: 'O campo estado é obrigatório' }),
});

export type CreateClinicSchema = z.infer<typeof createClinicSchema>;

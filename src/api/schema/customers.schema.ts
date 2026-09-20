import { customersTable, usersTable } from '@/db/schema';
import { z } from 'zod';

export type CustomersWithRelations = typeof customersTable.$inferSelect & {
	user: typeof usersTable.$inferSelect;
};

export const onboardingCustomerSchema = z.object({
	phone: z.string().nonempty({ message: 'O campo telefone é obrigatório' }),
	cpf: z.string().nonempty({ message: 'O campo CPF é obrigatório' }),
	gender: z
		.enum(['male', 'female'])
		.nonoptional({ message: 'O campo sexo é obrigatório' }),
	postalCode: z.string().nonempty({ message: 'O campo CEP é obrigatório' }),
	address: z.string().nonempty({ message: 'O campo endereço é obrigatório' }),
	addressNumber: z.string().optional(),
	neighborhood: z
		.string()
		.nonempty({ message: 'O campo bairro é obrigatório' }),
	city: z.string().nonempty({ message: 'O campo cidade é obrigatório' }),
	state: z.string().nonempty({ message: 'O campo estado é obrigatório' }),
});

export type OnboardingCustomerSchema = z.infer<typeof onboardingCustomerSchema>;

export const createCustomerWithUserSchema = z.object({
	id: z.uuid().optional().nullable(),
	name: z.string().nonempty({ message: 'O campo nome é obrigatório' }),
	email: z
		.string()
		.nonempty({ message: 'O campo email é obrigatório' })
		.email({ message: 'O campo email é inválido' }),
	image: z.string().optional(),
	phone: z.string().nonempty({ message: 'O campo telefone é obrigatório' }),
	cpf: z.string().nonempty({ message: 'O campo cpf é obrigatório' }),
	gender: z
		.enum(['male', 'female'])
		.nonoptional({ message: 'O campo sexo é obrigatório' }),
	postalCode: z.string().nonempty({ message: 'O campo cep é obrigatório' }),
	address: z.string().nonempty({ message: 'O campo rua é obrigatório' }),
	addressNumber: z.string().optional(),
	neighborhood: z
		.string()
		.nonempty({ message: 'O campo bairro é obrigatório' }),
	city: z.string().nonempty({ message: 'O campo cidade é obrigatório' }),
	state: z.string().nonempty({ message: 'O campo estado é obrigatório' }),
});

export type CreateCustomerWithUserSchema = z.infer<
	typeof createCustomerWithUserSchema
>;

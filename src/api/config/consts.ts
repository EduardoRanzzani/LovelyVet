import { ViaCepResponse } from '@/types/viacep';

export const MAX_PAGE_SIZE = 10;
export const REGINA_DOCTOR_ID = '284fc65a-9e6d-469a-900d-ff0d1005fe5a';

export type PaginatedData<T> = {
	data: T[];
	metadata: {
		totalCount: number;
		pageCount: number;
		currentPage: number;
		limit: number;
	};
};

export const searchAddressByPostalCode = async (
	postalCode: string,
): Promise<ViaCepResponse> => {
	const response = await fetch(`https://viacep.com.br/ws/${postalCode}/json`);
	const data = await response.json();
	return data;
};

export const CLERK_ERROR_MESSAGES: Record<string, string> = {
	form_identifier_exists:
		'Este e-mail ou nome de usuário já está sendo utilizado.',
	form_password_pwned:
		'Esta senha foi encontrada em um vazamento de dados. Por favor, escolha outra.',
	form_password_validation_failed:
		'A senha não atende aos requisitos de segurança.',
	form_identifier_format_incorrect:
		'O formato do e-mail ou nome de usuário é inválido.',
	form_data_missing: 'Dados obrigatórios estão faltando no formulário.',
	username_exists: 'Este nome de usuário já está em uso.',
};

export const weekDays = [
	{
		label: 'Domingo',
		value: '0',
	},
	{
		label: 'Segunda-feira',
		value: '1',
	},
	{
		label: 'Terça-feira',
		value: '2',
	},
	{
		label: 'Quarta-feira',
		value: '3',
	},
	{
		label: 'Quinta-feira',
		value: '4',
	},
	{
		label: 'Sexta-feira',
		value: '5',
	},
	{
		label: 'Sábado',
		value: '6',
	},
];

export const timesOfDay = [
	{
		label: '05:00',
		value: '05:00',
		group: 'Manhã',
	},
	{
		label: '05:30',
		value: '05:30',
		group: 'Manhã',
	},
	{
		label: '06:00',
		value: '06:00',
		group: 'Manhã',
	},
	{
		label: '06:30',
		value: '06:30',
		group: 'Manhã',
	},
	{
		label: '07:00',
		value: '07:00',
		group: 'Manhã',
	},
	{
		label: '07:30',
		value: '07:30',
		group: 'Manhã',
	},
	{
		label: '08:00',
		value: '08:00',
		group: 'Manhã',
	},
	{
		label: '08:30',
		value: '08:30',
		group: 'Manhã',
	},
	{
		label: '09:00',
		value: '09:00',
		group: 'Manhã',
	},
	{
		label: '09:30',
		value: '09:30',
		group: 'Manhã',
	},
	{
		label: '10:00',
		value: '10:00',
		group: 'Manhã',
	},
	{
		label: '10:30',
		value: '10:30',
		group: 'Manhã',
	},
	{
		label: '11:00',
		value: '11:00',
		group: 'Manhã',
	},
	{
		label: '11:30',
		value: '11:30',
		group: 'Manhã',
	},
	{
		label: '12:00',
		value: '12:00',
		group: 'Manhã',
	},
	{
		label: '12:30',
		value: '12:30',
		group: 'Manhã',
	},
	{
		label: '13:00',
		value: '13:00',
		group: 'Tarde',
	},
	{
		label: '13:30',
		value: '13:30',
		group: 'Tarde',
	},
	{
		label: '14:00',
		value: '14:00',
		group: 'Tarde',
	},
	{
		label: '14:30',
		value: '14:30',
		group: 'Tarde',
	},
	{
		label: '15:00',
		value: '15:00',
		group: 'Tarde',
	},
	{
		label: '15:30',
		value: '15:30',
		group: 'Tarde',
	},
	{
		label: '16:00',
		value: '16:00',
		group: 'Tarde',
	},
	{
		label: '16:30',
		value: '16:30',
		group: 'Tarde',
	},
	{
		label: '17:00',
		value: '17:00',
		group: 'Tarde',
	},
	{
		label: '17:30',
		value: '17:30',
		group: 'Tarde',
	},
	{
		label: '18:00',
		value: '18:00',
		group: 'Tarde',
	},
	{
		label: '18:30',
		value: '18:30',
		group: 'Tarde',
	},
	{
		label: '19:00',
		value: '19:00',
		group: 'Noite',
	},
	{
		label: '19:30',
		value: '19:30',
		group: 'Noite',
	},
	{
		label: '20:00',
		value: '20:00',
		group: 'Noite',
	},
	{
		label: '20:30',
		value: '20:30',
		group: 'Noite',
	},
	{
		label: '21:00',
		value: '21:00',
		group: 'Noite',
	},
	{
		label: '21:30',
		value: '21:30',
		group: 'Noite',
	},
	{
		label: '22:00',
		value: '22:00',
		group: 'Noite',
	},
	{
		label: '22:30',
		value: '22:30',
		group: 'Noite',
	},
	{
		label: '23:00',
		value: '23:00',
		group: 'Noite',
	},
	{
		label: '23:30',
		value: '23:30',
		group: 'Noite',
	},
];

export const ufs = [
	{
		label: 'AC',
		value: 'AC',
	},
	{
		label: 'AL',
		value: 'AL',
	},
	{
		label: 'AP',
		value: 'AP',
	},
	{
		label: 'AM',
		value: 'AM',
	},
	{
		label: 'BA',
		value: 'BA',
	},
	{
		label: 'CE',
		value: 'CE',
	},
	{
		label: 'DF',
		value: 'DF',
	},
	{
		label: 'ES',
		value: 'ES',
	},
	{
		label: 'GO',
		value: 'GO',
	},
	{
		label: 'MA',
		value: 'MA',
	},
	{
		label: 'MT',
		value: 'MT',
	},
	{
		label: 'MS',
		value: 'MS',
	},
	{
		label: 'MG',
		value: 'MG',
	},
	{
		label: 'PA',
		value: 'PA',
	},
	{
		label: 'PB',
		value: 'PB',
	},
	{
		label: 'PR',
		value: 'PR',
	},
	{
		label: 'PE',
		value: 'PE',
	},
	{
		label: 'PI',
		value: 'PI',
	},
	{
		label: 'RJ',
		value: 'RJ',
	},
	{
		label: 'RN',
		value: 'RN',
	},
	{
		label: 'RS',
		value: 'RS',
	},
	{
		label: 'RO',
		value: 'RO',
	},
	{
		label: 'RR',
		value: 'RR',
	},
	{
		label: 'SC',
		value: 'SC',
	},
	{
		label: 'SP',
		value: 'SP',
	},
	{
		label: 'SE',
		value: 'SE',
	},
	{
		label: 'TO',
		value: 'TO',
	},
];

export const convertAppointmentStatus = (status: string) => {
	switch (status) {
		case 'pending':
			return 'Pendente';
		case 'confirmed':
			return 'Confirmado';
		case 'in_progress':
			return 'Em Andamento';
		case 'completed':
			return 'Concluído';
		case 'cancelled':
			return 'Cancelado';
		default:
			return 'Cliente não encontrado';
	}
};

export const monthNames = [
	'january',
	'february',
	'march',
	'april',
	'may',
	'june',
	'july',
	'august',
	'september',
	'october',
	'november',
	'december',
];

export const getMonthIndex = (name: string) => {
	const index = monthNames.indexOf(name.toLowerCase());
	return index === 1 ? new Date().getMonth() : index;
};

import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ComponentProps } from 'react';
import CustomerDashboard from './customer-dashboard';

type Data = ComponentProps<typeof CustomerDashboard>['data'];
const empty: Data = {
	today: '2026-11-24',
	pets: [],
	appointments: [],
	reminders: [],
	outstandingInCents: 0,
	outstandingCount: 0,
};
const data: Data = {
	...empty,
	pets: [
		{
			id: 'pet-a',
			name: 'Teste',
			photo: null,
			birthDate: '2025-11-24',
			status: 'alive',
			breed: 'SRD',
			species: 'Canino',
		},
	],
	appointments: [
		{
			id: 'a',
			petId: 'pet-a',
			petName: 'Teste',
			status: 'confirmed',
			scheduledAt: new Date('2026-11-25T23:00:00Z'),
		},
	],
	reminders: [
		{ id: 'r', petId: 'pet-a', petName: 'Teste', title: 'Reforço V10', dueDate: '2026-11-23', appointmentId: null },
	],
	outstandingInCents: 20000,
	outstandingCount: 1,
};
describe('CustomerDashboard', () => {
	it('mantém o painel de boas-vindas neutro, sem gradiente colorido', () => {
		render(<CustomerDashboard data={empty} />);
		const welcome = screen.getByRole('region', { name: 'Boas-vindas' });
		expect(welcome).toHaveClass('bg-card');
		expect(welcome).not.toHaveClass('bg-linear-to-br', 'from-primary', 'to-accent/60');
		for (const link of within(welcome).getAllByRole('link')) {
			expect(link).toHaveClass('bg-muted/40');
		}
	});
	it('usa somente o primeiro nome do tutor e apresenta atalhos para as seções', () => {
		render(<CustomerDashboard data={empty} tutorName='  Eduardo Leite  ' />);
		const welcome = within(screen.getByRole('region', { name: 'Boas-vindas' }));
		expect(welcome.getByRole('heading', { name: 'Olá, Eduardo!' })).toBeInTheDocument();
		expect(welcome.getByRole('link', { name: /Meus pets/ })).toHaveAttribute('href', '#meus-pets');
		expect(welcome.getByRole('link', { name: /Próximos atendimentos/ })).toHaveAttribute(
			'href',
			'#proximos-atendimentos',
		);
		expect(welcome.getByRole('link', { name: /Lembretes de vacinação/ })).toHaveAttribute(
			'href',
			'#cuidados-vacinacao',
		);
	});
	it('exibe a saudação de aniversário somente para pets vivos', () => {
		render(
			<CustomerDashboard
				data={{
					...data,
					pets: [data.pets[0], { ...data.pets[0], id: 'pet-b', name: 'Outro pet', status: 'dead' }],
				}}
			/>,
		);
		expect(screen.getByText('Feliz aniversário, Teste!')).toBeInTheDocument();
		expect(screen.queryByText('Feliz aniversário, Outro pet!')).not.toBeInTheDocument();
	});
	it('indica o limite da lista sem apresentar cinco como total absoluto', () => {
		const appointments = Array.from({ length: 5 }, (_, index) => ({
			...data.appointments[0],
			id: `appointment-${index}`,
		}));
		render(<CustomerDashboard data={{ ...data, appointments }} />);
		const welcome = within(screen.getByRole('region', { name: 'Boas-vindas' }));
		expect(welcome.getByText('5 exibidos')).toBeInTheDocument();
		expect(welcome.getByText(/listas mostram até cinco registros/)).toBeInTheDocument();
		expect(screen.getByText('Próximo compromisso')).toBeInTheDocument();
	});
	it('destaca o estado financeiro em dia somente quando não há saldo pendente', () => {
		const { rerender } = render(<CustomerDashboard data={empty} />);
		expect(screen.getByText('Tudo em dia')).toBeInTheDocument();
		rerender(<CustomerDashboard data={data} />);
		expect(screen.queryByText('Tudo em dia')).not.toBeInTheDocument();
	});
	it('exibe o pet e a navegação para os detalhes', () => {
		render(<CustomerDashboard data={data} />);
		const pets = within(screen.getByRole('region', { name: 'Meus pets' }));
		expect(pets.getByText('1 pet vinculado')).toBeInTheDocument();
		expect(pets.getByRole('link', { name: /Teste/ })).toHaveAttribute('href', '/pets/pet-a');
		expect(pets.getByText('1 ano')).toBeInTheDocument();
	});
	it('exibe horários locais e retornos vencidos', () => {
		render(<CustomerDashboard data={data} />);
		expect(screen.getByText(/25\/11\/2026.*19:00/)).toBeInTheDocument();
		expect(screen.getByText('Confirmado')).toBeInTheDocument();
		expect(screen.getByText('Reforço V10')).toBeInTheDocument();
		expect(screen.getByText('Vencido')).toBeInTheDocument();
	});
	it('identifica um retorno já agendado mesmo com data original vencida', () => {
		render(<CustomerDashboard data={{ ...data, reminders: [{ ...data.reminders[0], appointmentId: 'a' }] }} />);
		expect(screen.getByText('Agendado')).toBeInTheDocument();
		expect(screen.queryByText('Vencido')).not.toBeInTheDocument();
	});
	it('exibe saldo compartilhado e somente atalho de consulta', () => {
		render(<CustomerDashboard data={data} />);
		const finance = within(screen.getByRole('region', { name: 'Meu financeiro' }));
		expect(finance.getByText(/R\$\s*200,00/)).toBeInTheDocument();
		expect(finance.getByText('1 cobrança em aberto')).toBeInTheDocument();
		expect(finance.getByRole('link', { name: /Consultar meu financeiro/ })).toHaveAttribute('href', '/my-finance');
		expect(finance.queryByRole('button')).not.toBeInTheDocument();
	});
	it('exibe estados vazios sem sugerir ações administrativas', () => {
		render(<CustomerDashboard data={empty} />);
		expect(screen.getByText(/Você ainda não possui pets vinculados/)).toBeInTheDocument();
		expect(screen.getByText('Nenhum próximo atendimento agendado.')).toBeInTheDocument();
		expect(screen.getByText('Nenhum lembrete de vacinação pendente nesse período.')).toBeInTheDocument();
		expect(screen.getByText('0 cobranças em aberto')).toBeInTheDocument();
	});
});

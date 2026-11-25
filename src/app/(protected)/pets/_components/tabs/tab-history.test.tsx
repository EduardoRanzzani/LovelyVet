import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Suspense } from 'react';
import type { PetsWithRelations } from '@/api/schema/pets.schema';
import type { UserRole } from '@/lib/security/roles';
import type { TimelineItem } from '@/api/schema/timeline.schema';
import { Tabs } from '@/components/ui/tabs';
import TabHistory from './tab-history';
import TabTimeline from './tab-timeline';
import PetDetailsClient from '../pet-details';

vi.mock('@/api/actions/timeline.actions', () => ({ deleteTimelineItem: vi.fn() }));
vi.mock('next-safe-action/hooks', () => ({ useAction: () => ({ execute: vi.fn(), isExecuting: false }) }));
vi.mock('next/image', () => ({ default: ({ alt }: { alt: string }) => <span role='img' aria-label={alt} /> }));
vi.mock('@/components/list/edit-button', () => ({ default: () => <button>Editar cadastro</button> }));
vi.mock('../pet-form', () => ({ default: () => null }));
vi.mock('../tutor-pet-photo-dialog', () => ({ default: () => <button>Gerenciar foto</button> }));
vi.mock('@/components/clinical-documents/document-pdf-download-button', () => ({ default: () => null }));
vi.mock('../dialogs/dialog-weight', () => ({ default: () => <button data-slot='dialog-trigger'>Peso</button> }));
vi.mock('../dialogs/dialog-notes', () => ({ default: () => <button data-slot='dialog-trigger'>Observações</button> }));
vi.mock('../dialogs/dialog-vaccine', () => ({ default: () => <button data-slot='dialog-trigger'>Vacinas</button> }));
vi.mock('./history/pet-history', () => ({
	HistoryItem: ({ title, canDelete, onDelete }: { title: string; canDelete: boolean; onDelete: () => void }) => (
		<div>
			{title}
			{canDelete && <button onClick={onDelete}>Excluir {title}</button>}
		</div>
	),
}));

const note: TimelineItem = {
	id: 'note',
	type: 'note',
	title: 'Observação',
	date: new Date(2026, 10, 25),
	content: 'Teste',
	icon: null,
	color: 'bg-notes/80',
	canDelete: true,
};
const vaccine: TimelineItem = { ...note, id: 'vaccine', type: 'vaccine', title: 'Vacina', canDelete: false };

function open(canDelete = true) {
	const onDelete = vi.fn();
	render(
		<Tabs defaultValue='history'>
			<TabHistory
				doctors={[]}
				vaccineServices={[]}
				historyEvents={[note, vaccine]}
				petId='pet-test'
				canDelete={canDelete}
				onDelete={onDelete}
			/>
		</Tabs>,
	);
	return onDelete;
}

afterEach(cleanup);

describe('layout do histórico clínico', () => {
	it('preserva as sete ações clínicas e o destino da emissão de documentos', () => {
		open();
		for (const name of ['Peso', 'Patologia', 'Documento', 'Exame', 'Vacinas', 'Observações']) {
			expect(screen.getByRole('button', { name })).toBeInTheDocument();
		}
		expect(screen.getByRole('link', { name: 'Receita / Encaminhamento' })).toHaveAttribute(
			'href',
			'/pets/pet-test/documents/new',
		);
	});
	it('remove o limite de altura interno no layout expandido', () => {
		open();
		expect(screen.getByLabelText('Registros do histórico')).not.toHaveClass('md:max-h-70');
		expect(screen.getByText('Ações clínicas')).toBeInTheDocument();
	});
	it('adota o painel aprovado como padrão sem rolagem interna', () => {
		open();
		const records = screen.getByLabelText('Registros do histórico');
		expect(records).not.toHaveClass('md:max-h-70');
		expect(records).not.toHaveClass('md:overflow-y-auto');
		expect(screen.getByRole('heading', { name: 'Histórico Clínico' }).closest('section')).toHaveClass(
			'rounded-xl',
			'border',
		);
	});
	it('preserva a exclusão de observações e protege a vacina vinculada', () => {
		const onDelete = open();
		fireEvent.click(screen.getByRole('button', { name: 'Excluir Observação' }));
		expect(onDelete).toHaveBeenCalledWith(note);
		expect(screen.queryByRole('button', { name: 'Excluir Vacina' })).not.toBeInTheDocument();
	});
	it('não disponibiliza exclusão quando o chamador não permite', () => {
		open(false);
		expect(screen.queryByRole('button', { name: 'Excluir Observação' })).not.toBeInTheDocument();
	});
});

describe('padronização das abas clínicas', () => {
	it('não expande a receita por duas colunas no novo grid', () => {
		open();
		const link = screen.getByRole('link', { name: 'Receita / Encaminhamento' });
		expect(link).not.toHaveClass('col-span-2');
		expect(link.parentElement).toHaveClass('w-full', 'grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3');
		expect(link.parentElement).not.toHaveClass('max-w-xl');
	});
	it('divide ações e histórico em duas colunas iguais apenas em telas grandes', () => {
		open();
		const actions = screen.getByRole('group', { name: 'Ações clínicas' });
		const panel = screen.getByRole('heading', { name: 'Histórico Clínico' }).closest('section');
		expect(actions.parentElement).toHaveClass('grid', 'grid-cols-1', '2xl:grid-cols-2', 'items-start');
		expect(actions.nextElementSibling).toBe(panel);
	});
	it('usa a mesma regra de tamanho para botões simples, gatilhos de modal e link', () => {
		open();
		const actions = screen.getByRole('group', { name: 'Ações clínicas' });
		const queries = within(actions);
		const controls = [...queries.getAllByRole('button'), ...queries.getAllByRole('link')];
		expect(controls).toHaveLength(7);
		for (const control of controls) {
			expect(control.parentElement).toBe(actions);
		}
		expect(queries.getByRole('button', { name: 'Peso' })).toHaveAttribute('data-slot', 'dialog-trigger');
		expect(actions).toHaveClass(
			'[&>:is(button,a)]:h-11',
			'[&>:is(button,a)]:w-full',
			'[&>:is(button,a)]:whitespace-normal',
		);
	});
	it('usa largura integral e rolagem natural também na linha do tempo', () => {
		render(
			<Tabs defaultValue='timeline'>
				<TabTimeline historyEvents={[note]} canDelete onDelete={vi.fn()} />
			</Tabs>,
		);
		expect(screen.getByRole('heading', { name: 'Linha do Tempo' })).toBeInTheDocument();
		expect(screen.getByText('1 registro')).toBeInTheDocument();
		expect(screen.getByLabelText('Registros do histórico')).not.toHaveClass('md:max-h-70');
	});
	it('mostra a linha do tempo de leitura sem ações clínicas ou exclusão', () => {
		render(
			<Tabs defaultValue='timeline'>
				<TabTimeline historyEvents={[{ ...vaccine, canDelete: true }]} canDelete={false} onDelete={vi.fn()} />
			</Tabs>,
		);
		expect(screen.getByText('Vacina')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Excluir/ })).not.toBeInTheDocument();
		expect(screen.queryByText('Ações clínicas')).not.toBeInTheDocument();
	});
	it('usa o mesmo painel com borda na linha do tempo por padrão', () => {
		render(
			<Tabs defaultValue='timeline'>
				<TabTimeline historyEvents={[note]} canDelete={false} onDelete={vi.fn()} />
			</Tabs>,
		);
		expect(screen.getByRole('heading', { name: 'Linha do Tempo' }).closest('section')).toHaveClass(
			'rounded-xl',
			'border',
		);
		expect(screen.getByLabelText('Registros do histórico')).not.toHaveClass('md:max-h-70');
	});
});

describe('detalhes do pet por perfil', () => {
	async function renderPet(viewerRole: UserRole) {
		const pet = {
			id: 'pet-test',
			name: 'Paciente fictício',
			birthDate: '2024-01-01',
			color: 'Branca',
			gender: 'female',
			photo: null,
			breed: { name: 'SRD', specie: { name: 'Canino' } },
			petTutors: [
				{
					tutor: {
						user: { name: 'Tutor fictício' },
						address: 'Endereço fictício',
						addressNumber: '1',
						neighborhood: 'Bairro',
						city: 'Cidade',
						state: 'MS',
					},
				},
			],
			weightHistory: [{ id: 'weight', measuredAt: new Date(2026, 10, 25), weightInGrams: 1200 }],
			notes: [
				{
					id: 'private',
					createdAt: new Date(2026, 10, 25),
					content: '<p>Nota interna</p>',
					author: { name: 'Equipe fictícia', image: null },
				},
			],
		} as unknown as PetsWithRelations;
		const props = {
			pet,
			doctors: [],
			vaccineServices: [],
			speciesPromise: Promise.resolve([]),
			breedsPromise: Promise.resolve([]),
			customersPromise: Promise.resolve([]),
			viewerRole,
		};
		await act(async () => {
			render(
				<Suspense fallback={<p>Carregando</p>}>
					<PetDetailsClient {...props} />
				</Suspense>,
			);
		});
	}
	it('mostra somente a linha do tempo e a edição de foto para Customer', async () => {
		await renderPet('customer');
		expect(screen.getByRole('heading', { name: 'Dados Cadastrais' })).toBeInTheDocument();
		expect(screen.getAllByRole('tab')).toHaveLength(1);
		expect(screen.getByRole('tab', { name: 'Linha do Tempo' })).toHaveAttribute('data-state', 'active');
		expect(screen.getByRole('button', { name: 'Gerenciar foto' })).toBeInTheDocument();
		expect(screen.getByText('Pesagem')).toBeInTheDocument();
		expect(screen.queryByText('Observação')).not.toBeInTheDocument();
		expect(screen.queryByText('Ações clínicas')).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Excluir|Editar cadastro/ })).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Abrir no Google Maps' })).not.toBeInTheDocument();
	});
	it.each(['admin', 'doctor'] as const)('mantém as cinco abas e ações para %s', async (role) => {
		await renderPet(role);
		expect(screen.getAllByRole('tab')).toHaveLength(5);
		expect(screen.getByRole('tab', { name: 'Histórico' })).toHaveAttribute('data-state', 'active');
		expect(screen.getByRole('button', { name: 'Editar cadastro' })).toBeInTheDocument();
		expect(screen.getByText('Ações clínicas')).toBeInTheDocument();
		expect(screen.getByText('Observação')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Excluir Observação' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Abrir no Google Maps' })).toBeInTheDocument();
	});
});

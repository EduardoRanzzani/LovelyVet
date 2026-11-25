import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AdminFormClient from './admin-form';

vi.mock('@/api/actions/admin.actions', () => ({ verifyCurrentClerkIdentity: vi.fn() }));
vi.mock('@/api/actions/admin-clerk-link.actions', () => ({ previewClerkLink: vi.fn(), confirmClerkLink: vi.fn() }));
vi.mock('next-safe-action/hooks', () => ({ useAction: () => ({ execute: vi.fn(), isPending: false }) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const user = {
	id: '22222222-2222-4222-8222-222222222222',
	name: 'Tutor Teste',
	email: 'tutor@example.invalid',
	role: 'customer' as const,
	identities: [],
};
const props = { filter: '', page: 1, hasNext: false };

describe('central administrativa de identidades', () => {
	it.each(['development', 'production'] as const)('permite vincular apenas no ambiente %s', (environment) => {
		render(<AdminFormClient {...props} environment={environment} users={[user]} />);
		expect(screen.getAllByRole('button', { name: 'Vincular' })).toHaveLength(1);
		expect(screen.getByText('Acesse este ambiente para vincular.')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Vincular' }));
		expect(screen.getByRole('dialog')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Validar identidade' })).toBeDisabled();
		fireEvent.change(screen.getByLabelText('Clerk User ID'), { target: { value: 'user_valid' } });
		expect(screen.getByRole('button', { name: 'Validar identidade' })).toBeEnabled();
		expect(screen.queryByRole('button', { name: 'Confirmar vínculo' })).not.toBeInTheDocument();
	});
	it('mostra IDs existentes sem permitir substituição', () => {
		render(
			<AdminFormClient
				{...props}
				environment='development'
				users={[
					{
						...user,
						identities: [
							{ environment: 'development', clerkUserId: 'user_dev' },
							{ environment: 'production', clerkUserId: 'user_prod' },
						],
					},
				]}
			/>,
		);
		expect(screen.getByText('user_dev')).toBeInTheDocument();
		expect(screen.getByText('user_prod')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Vincular' })).not.toBeInTheDocument();
	});
});

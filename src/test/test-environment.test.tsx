import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('test environment', () => {
	it('renders React components with DOM assertions', () => {
		render(<button type='button'>Salvar</button>);
		expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
	});

	it('supports disabled controls', () => {
		render(<button type='button' disabled>Excluir</button>);
		expect(screen.getByRole('button', { name: 'Excluir' })).toBeDisabled();
	});
});

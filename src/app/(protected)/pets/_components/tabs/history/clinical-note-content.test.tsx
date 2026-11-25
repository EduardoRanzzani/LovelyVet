import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ClinicalNoteContent from './clinical-note-content';

describe('ClinicalNoteContent', () => {
	it('renderiza os parágrafos e a formatação sem exibir tags literais', () => {
		const { container } = render(
			<ClinicalNoteContent content='<p>Teste <strong>clínico</strong></p><ul><li>Item</li></ul>' />,
		);

		expect(container.querySelector('p')).toHaveTextContent('Teste clínico');
		expect(container.querySelector('strong')).toHaveTextContent('clínico');
		expect(screen.getByRole('listitem')).toHaveTextContent('Item');
		expect(container).not.toHaveTextContent('<p>');
	});

	it('remove elementos ativos, eventos e CSS não permitido', () => {
		const { container } = render(
			<ClinicalNoteContent
				content={
					'<p onclick="alert(1)" style="position: absolute; text-align: center">Seguro</p><img src=x onerror=alert(1)><script>alert(1)</script>'
				}
			/>,
		);

		const paragraph = screen.getByText('Seguro');
		expect(paragraph).not.toHaveAttribute('onclick');
		expect(paragraph).toHaveStyle({ textAlign: 'center' });
		expect(paragraph.style.position).toBe('');
		expect(container.querySelector('img, script, [onerror]')).toBeNull();
	});

	it('mantém observações antigas em texto simples', () => {
		render(<ClinicalNoteContent content='Observação anterior' />);
		expect(screen.getByText('Observação anterior')).toBeInTheDocument();
	});
});

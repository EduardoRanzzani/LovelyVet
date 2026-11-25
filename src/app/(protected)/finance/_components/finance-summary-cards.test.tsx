import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FinanceSummaryCards } from './finance-summary-cards';

const example = {
	billedInCents: 11500,
	receivedInCents: 8500,
	outstandingInCents: 3000,
	invoicedCount: 3,
};

function card(name: string) {
	return screen.getByRole('region', { name });
}

describe('FinanceSummaryCards', () => {
	it('exibe os quatro indicadores fornecidos pelo relatório sem recalcular os valores', () => {
		render(<FinanceSummaryCards {...example} />);
		expect(within(card('Faturado no mês')).getByText(/R\$\s*115,00/)).toBeInTheDocument();
		expect(within(card('Recebido no mês')).getByText(/R\$\s*85,00/)).toBeInTheDocument();
		expect(within(card('Saldo total em aberto')).getByText(/R\$\s*30,00/)).toBeInTheDocument();
		expect(within(card('Cobranças válidas no mês')).getByText('3')).toBeInTheDocument();
	});

	it('preserva o saldo acumulado quando o mês não tem faturamento ou recebimento', () => {
		render(<FinanceSummaryCards {...example} billedInCents={0} receivedInCents={0} invoicedCount={0} />);
		expect(within(card('Faturado no mês')).getByText(/R\$\s*0,00/)).toBeInTheDocument();
		expect(within(card('Recebido no mês')).getByText(/R\$\s*0,00/)).toBeInTheDocument();
		expect(within(card('Saldo total em aberto')).getByText(/R\$\s*30,00/)).toBeInTheDocument();
		expect(within(card('Cobranças válidas no mês')).getByText('0')).toBeInTheDocument();
	});

	it('configura a grade responsiva pela largura do contêiner', () => {
		render(<FinanceSummaryCards {...example} />);
		const grid = screen.getByTestId('finance-summary-grid');
		expect(grid.parentElement).toHaveClass('@container');
		expect(grid).toHaveClass('grid-cols-1', '@min-[300px]:grid-cols-2', '@min-[900px]:grid-cols-4');
	});
});

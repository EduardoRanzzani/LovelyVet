import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ChargeStatus } from '@/lib/finance/ledger';
import { ChargeStatusBadge } from './charge-status-badge';

const cases = [
	['pending', 'Pendente', 'bg-amber-100', 'dark:text-amber-200'],
	['partial', 'Parcialmente paga', 'bg-sky-100', 'dark:text-sky-200'],
	['paid', 'Paga', 'bg-emerald-100', 'dark:text-emerald-200'],
	['void', 'Cancelada', 'bg-rose-100', 'dark:text-rose-200'],
] as const satisfies readonly (readonly [ChargeStatus, string, string, string])[];

describe('ChargeStatusBadge', () => {
	it.each(cases)('traduz o status %s e aplica o badge correspondente', (status, label, color, darkColor) => {
		render(<ChargeStatusBadge status={status} />);
		const badge = screen.getByText(label);
		expect(badge).toHaveAttribute('data-slot', 'badge');
		expect(badge).toHaveClass(color, darkColor);
		expect(screen.queryByText(status)).not.toBeInTheDocument();
	});
});

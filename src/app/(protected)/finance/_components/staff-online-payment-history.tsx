'use client';

import { syncStaffOnlinePayment } from '@/api/actions/online-payment.actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrencyFromCents } from '@/helpers/currency';
import {
	canStaffSyncAttempt,
	staffPaymentStatusLabels,
	staffReviewMessage,
	type StaffOnlinePaymentAttempt,
} from '@/lib/finance/staff-online-payment';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
	timeZone: 'America/Campo_Grande',
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
});

function methodLabel(attempt: StaffOnlinePaymentAttempt) {
	if (attempt.method === 'pix') return 'Pix';
	if (attempt.method === 'credit_card') {
		return `Cartão de crédito${attempt.installments > 1 ? ` · ${attempt.installments} parcelas` : ' · à vista'}`;
	}
	return 'Cartão de débito';
}

export function StaffOnlinePaymentHistory({
	attempts,
	compact = false,
}: {
	attempts: readonly StaffOnlinePaymentAttempt[];
	compact?: boolean;
}) {
	const router = useRouter();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const sync = useAction(syncStaffOnlinePayment, {
		onSuccess: ({ data }) => {
			if (data?.remoteUnavailable)
				toast.warning('Mercado Pago indisponível ou Order não encontrada. Tente novamente.');
			else toast.success('Consulta concluída. Situação financeira atualizada.');
			router.refresh();
		},
		onError: ({ error }) => toast.error(error.serverError ?? 'Não foi possível sincronizar a tentativa.'),
	});

	if (!attempts.length) return null;
	return (
		<section aria-label='Tentativas de pagamento online' className='space-y-2 border-t pt-3'>
			<h4 className='text-sm font-medium'>Tentativas de pagamento online</h4>
			<p className='text-xs text-muted-foreground'>
				Tentativas não são recebimentos. Apenas pagamentos confirmados no histórico acima compõem o saldo.
			</p>
			<ul className='divide-y'>
				{attempts.map((attempt) => (
					<li
						key={attempt.id}
						className='flex min-w-0 flex-wrap items-start justify-between gap-2 py-2 text-sm'
					>
						<div className='min-w-0 flex-1 basis-40 space-y-1'>
							<div className='flex flex-wrap items-center gap-2'>
								<span className='font-medium'>{methodLabel(attempt)}</span>
								<Badge variant={attempt.status === 'review' ? 'destructive' : 'outline'}>
									{staffPaymentStatusLabels[attempt.status] ?? 'Situação desconhecida'}
								</Badge>
							</div>
							<p className='text-xs text-muted-foreground'>
								Iniciada em {dateFormatter.format(new Date(attempt.createdAt))}
							</p>
							{!compact && (
								<p className='text-xs text-muted-foreground'>
									Última atualização: {dateFormatter.format(new Date(attempt.updatedAt))}
								</p>
							)}
							{attempt.expiresAt && attempt.status === 'pending' && (
								<p className='text-xs text-muted-foreground'>
									Expiração prevista: {dateFormatter.format(new Date(attempt.expiresAt))}
								</p>
							)}
							{attempt.status === 'review' && (
								<p role='alert' className='text-xs font-medium text-destructive'>
									{staffReviewMessage(attempt.reconciliationReason)}. Não efetuar baixa automática.
								</p>
							)}
						</div>
						<div className='flex flex-col items-end gap-2'>
							<span className='font-medium tabular-nums'>
								{formatCurrencyFromCents(attempt.amountInCents)}
							</span>
							{canStaffSyncAttempt(attempt.status) && (
								<Button
									type='button'
									variant='outline'
									size='sm'
									disabled={sync.isPending}
									onClick={() => {
										setSelectedId(attempt.id);
										sync.execute({ attemptId: attempt.id });
									}}
								>
									{sync.isPending && selectedId === attempt.id ? 'Consultando...' : 'Sincronizar'}
								</Button>
							)}
						</div>
					</li>
				))}
			</ul>
		</section>
	);
}

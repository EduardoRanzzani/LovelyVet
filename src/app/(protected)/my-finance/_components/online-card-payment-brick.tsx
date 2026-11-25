'use client';

import { CardPayment, initMercadoPago } from '@mercadopago/sdk-react';
import { useCallback, useMemo, useState, type ComponentProps } from 'react';
import { buildCardPaymentPayload, type CardPaymentPayload } from '@/lib/finance/online-card-payment';

const publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY?.trim();
// Loaded lazily only when the card option is selected.
if (typeof window !== 'undefined' && publicKey) initMercadoPago(publicKey, { locale: 'pt-BR' });

type Props = {
	chargeId: string;
	balanceInCents: number;
	canSubmit: boolean;
	onPayment: (input: CardPaymentPayload) => Promise<boolean>;
};
type BrickSubmit = NonNullable<ComponentProps<typeof CardPayment>['onSubmit']>;

export default function OnlineCardPaymentBrick({ chargeId, balanceInCents, canSubmit, onPayment }: Props) {
	const [message, setMessage] = useState('');
	const initialization = useMemo(() => ({ amount: balanceInCents / 100 }), [balanceInCents]);
	const customization = useMemo<NonNullable<ComponentProps<typeof CardPayment>['customization']>>(
		() => ({
			paymentMethods: {
				types: { excluded: ['debit_card', 'prepaid_card'] },
				minInstallments: 1,
				maxInstallments: 24,
			},
			visual: { hidePaymentButton: !canSubmit, style: { theme: 'default' } },
		}),
		[canSubmit],
	);
	const onError = useCallback(() => {
		setMessage('Não foi possível carregar ou processar os dados do cartão.');
	}, []);
	const onSubmit = useCallback<BrickSubmit>(
		async (form, additionalData) => {
			if (!canSubmit) throw new Error('Pagamento indisponível.');
			const payload = buildCardPaymentPayload(chargeId, balanceInCents, form, additionalData?.paymentTypeId);
			if (!payload) {
				setMessage('Confira os dados do cartão de crédito e o valor da cobrança.');
				throw new Error('Dados inválidos.');
			}
			setMessage('');
			if (!(await onPayment(payload))) throw new Error('Não foi possível confirmar a solicitação.');
		},
		[canSubmit, chargeId, balanceInCents, onPayment],
	);
	if (!publicKey)
		return (
			<p role='status' className='text-sm text-muted-foreground'>
				Pagamento com cartão indisponível. Public Key não configurada.
			</p>
		);
	return (
		<div className='min-w-0 space-y-2'>
			{!canSubmit && (
				<p className='text-sm text-muted-foreground'>
					Prévia do cartão. Não insira dados reais. O envio está desabilitado.
				</p>
			)}
			<CardPayment
				initialization={initialization}
				customization={customization}
				onSubmit={onSubmit}
				onError={onError}
			/>
			{message && (
				<p role='status' className='text-sm text-destructive'>
					{message}
				</p>
			)}
		</div>
	);
}

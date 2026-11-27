'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Copy, CreditCard, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startOnlinePayment, syncOnlinePayment } from '@/api/actions/online-payment.actions';
import type { OnlinePaymentInput } from '@/api/schema/online-payment.schema';
import { formatCurrencyFromCents } from '@/helpers/currency';
import {
	isActivePaymentStatus,
	paymentStatusMessage,
	type OnlinePaymentOption,
} from '@/lib/finance/online-payment-view';

const OnlineCardPaymentBrick = lazy(() => import('./online-card-payment-brick'));

type Props = { chargeId: string; balanceInCents: number; option: OnlinePaymentOption };
type Snapshot = {
	status: string;
	amountInCents: number;
	pix: { code: string; pngBase64: string | null; expiresAt?: string } | null;
	remoteUnavailable: boolean;
	retryAfterSeconds: number;
};

export function OnlinePaymentCheckout({ chargeId, balanceInCents, option }: Props) {
	const router = useRouter();
	const [method, setMethod] = useState<'pix' | 'credit_card'>('pix');
	const [localAttemptId, setAttemptId] = useState(option.attemptId);
	const attemptId = localAttemptId ?? option.attemptId;
	const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState('');
	const [uncertainStart, setUncertainStart] = useState(false);
	const running = useRef(false);
	const startAttempted = useRef(false);
	const sync = useCallback(
		async (id: string) => {
			if (running.current) return;
			running.current = true;
			setBusy(true);
			setMessage('');
			try {
				const result = await syncOnlinePayment({ attemptId: id });
				if (!result?.data) {
					setSnapshot(null);
					setMessage('Não foi possível consultar o pagamento. Tente novamente.');
					return;
				}
				setSnapshot(result.data);
				if (!isActivePaymentStatus(result.data.status)) router.refresh();
			} catch {
				setSnapshot(null);
				setMessage('Não foi possível consultar o pagamento. Tente novamente.');
			} finally {
				running.current = false;
				setBusy(false);
			}
		},
		[router],
	);
	const active = !snapshot || isActivePaymentStatus(snapshot.status);
	const delay = Math.max(15, snapshot?.retryAfterSeconds ?? 15);
	// Apenas agenda a consulta; não altera state durante a execução do effect.
	useEffect(() => {
		if (!attemptId || !active) return;
		const timer = window.setInterval(() => {
			if (document.visibilityState === 'visible') void sync(attemptId);
		}, delay * 1000);
		return () => window.clearInterval(timer);
	}, [attemptId, active, delay, sync]);
	const startPayment = useCallback(
		async (input: OnlinePaymentInput): Promise<boolean> => {
			if (
				!option.canStart ||
				input.chargeId !== chargeId ||
				attemptId ||
				uncertainStart ||
				running.current ||
				startAttempted.current
			)
				return false;
			startAttempted.current = true;
			running.current = true;
			setBusy(true);
			setMessage('');
			try {
				const result = await startOnlinePayment(input);
				if (!result?.data) {
					setUncertainStart(true);
					setMessage(
						'Não foi possível confirmar a solicitação. Atualize a página antes de tentar novamente.',
					);
					router.refresh();
					return false;
				}
				setAttemptId(result.data.attemptId);
				setSnapshot(result.data.snapshot ?? null);
				router.refresh();
				return true;
			} catch {
				setUncertainStart(true);
				setMessage('Não foi possível confirmar a solicitação. Atualize a página antes de tentar novamente.');
				router.refresh();
				return false;
			} finally {
				running.current = false;
				setBusy(false);
			}
		},
		[option.canStart, chargeId, attemptId, uncertainStart, router],
	);
	async function copyPix(code: string) {
		try {
			await navigator.clipboard.writeText(code);
			setMessage('Código Pix copiado.');
		} catch {
			setMessage('Não foi possível copiar automaticamente. Selecione o código Pix.');
		}
	}
	const pix = !busy && snapshot?.status === 'pending' ? snapshot.pix : null;
	const canRetry =
		!busy &&
		option.canStart &&
		!option.attemptId &&
		snapshot !== null &&
		['rejected', 'cancelled', 'expired'].includes(snapshot.status);
	function retryPayment() {
		if (!canRetry || running.current) return;
		startAttempted.current = false;
		setAttemptId(null);
		setSnapshot(null);
		setUncertainStart(false);
		setMessage('');
		setMethod('pix');
	}
	return (
		<div className='min-w-0 space-y-4'>
			{option.testMode && (
				<p className='rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900'>
					Ambiente de homologação. Não utilize pagamentos reais.
				</p>
			)}
			<div className='rounded-lg bg-muted/50 p-3'>
				<p className='text-xs text-muted-foreground'>{attemptId ? 'Valor da tentativa' : 'Saldo atual'}</p>
				<p className='text-xl font-semibold tabular-nums'>
					{formatCurrencyFromCents(snapshot?.amountInCents ?? balanceInCents)}
				</p>
			</div>
			{attemptId ? (
				<div className='space-y-3'>
					<p role='status' className='text-sm font-medium'>
						{snapshot ? paymentStatusMessage(snapshot.status) : 'Consulte o pagamento em andamento.'}
					</p>
					{snapshot?.remoteUnavailable && (
						<p className='text-sm text-muted-foreground'>
							Consulta remota indisponível. Não inicie outro pagamento.
						</p>
					)}
					{pix && (
						<div className='space-y-3'>
							{pix.pngBase64 && (
								<Image
									src={`data:image/png;base64,${pix.pngBase64}`}
									width={200}
									height={200}
									unoptimized
									alt='QR Code Pix'
									className='mx-auto rounded-md bg-white'
								/>
							)}
							<p className='text-sm text-muted-foreground'>
								{pix.expiresAt
									? `Validade informada: ${new Date(pix.expiresAt).toLocaleString('pt-BR')}`
									: 'Prazo de expiração não informado pelo provedor.'}
							</p>
							<p className='text-sm font-medium'>Pix Copia e Cola</p>
							<textarea
								aria-label='Código Pix'
								readOnly
								value={pix.code}
								className='w-full rounded-md border p-2 text-xs break-all'
								rows={3}
							/>
							<Button
								type='button'
								variant='outline'
								className='w-full'
								onClick={() => void copyPix(pix.code)}
							>
								<Copy /> Copiar código Pix
							</Button>
						</div>
					)}
					<Button
						type='button'
						variant='outline'
						className='w-full'
						disabled={busy}
						onClick={() => void sync(attemptId)}
					>
						{busy ? 'Consultando…' : 'Atualizar situação'}
					</Button>
					{canRetry && (
						<Button type='button' className='w-full' onClick={retryPayment}>
							Tentar outro pagamento
						</Button>
					)}
				</div>
			) : (
				<div className='space-y-3'>
					<div className='grid gap-2 sm:grid-cols-2' role='group' aria-label='Forma de pagamento'>
						<Button
							type='button'
							variant='outline'
							aria-pressed={method === 'pix'}
							disabled={busy || uncertainStart}
							className='h-auto justify-start gap-3 whitespace-normal p-3 aria-pressed:border-primary aria-pressed:bg-primary/10'
							onClick={() => setMethod('pix')}
						>
							<QrCode />
							<span className='text-left'>
								<span className='block font-medium'>Pix</span>
								<span className='block text-xs text-muted-foreground'>QR Code e Copia e Cola</span>
							</span>
						</Button>
						<Button
							type='button'
							variant='outline'
							aria-pressed={method === 'credit_card'}
							disabled={busy || uncertainStart}
							className='h-auto justify-start gap-3 whitespace-normal p-3 aria-pressed:border-primary aria-pressed:bg-primary/10'
							onClick={() => setMethod('credit_card')}
						>
							<CreditCard />
							<span className='text-left'>
								<span className='block font-medium'>Cartão de crédito</span>
								<span className='block text-xs text-muted-foreground'>À vista ou parcelado</span>
							</span>
						</Button>
					</div>
					{!option.canStart && (
						<p className='text-sm text-muted-foreground'>
							A criação de pagamentos ainda não está liberada para esta cobrança.
						</p>
					)}
					{method === 'pix' ? (
						<Button
							type='button'
							className='w-full'
							disabled={!option.canStart || busy || uncertainStart}
							onClick={() => void startPayment({ chargeId, method: 'pix' })}
						>
							{busy ? 'Solicitando…' : 'Gerar Pix'}
						</Button>
					) : (
						!uncertainStart && (
							<Suspense
								fallback={
									<p role='status' className='text-sm text-muted-foreground'>
										Carregando pagamento com cartão…
									</p>
								}
							>
								<OnlineCardPaymentBrick
									key={`${chargeId}:${balanceInCents}`}
									chargeId={chargeId}
									balanceInCents={balanceInCents}
									canSubmit={option.canStart}
									onPayment={startPayment}
								/>
							</Suspense>
						)
					)}
					{method === 'credit_card' && busy && (
						<p role='status' className='text-sm text-muted-foreground'>
							Solicitando pagamento…
						</p>
					)}
				</div>
			)}
			{message && (
				<p role='status' className='text-sm text-muted-foreground'>
					{message}
				</p>
			)}
		</div>
	);
}

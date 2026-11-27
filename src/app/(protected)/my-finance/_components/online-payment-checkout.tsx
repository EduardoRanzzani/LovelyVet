'use client';

import type { StatementItem } from '@/lib/finance/customer-statement';
import type { ReactNode } from 'react';
import { OnlinePaymentLayout } from './online-payment-layout';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { CircleX, Copy, CreditCard, LoaderCircle, QrCode, ShieldAlert } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import MoneyInputForm from '@/components/form/money-input-form';
import { fromCents, toCents } from '@/lib/money/currency';
import { Button } from '@/components/ui/button';
import { startOnlinePayment, syncOnlinePayment } from '@/api/actions/online-payment.actions';
import type { OnlinePaymentInput } from '@/api/schema/online-payment.schema';
import { formatCurrencyFromCents } from '@/helpers/currency';
import {
	isActivePaymentStatus,
	paymentStatusMessage,
	type OnlinePaymentOption,
	type OnlinePaymentSnapshot,
} from '@/lib/finance/online-payment-view';
import { OnlinePaymentSuccess } from './online-payment-success';

const OnlineCardPaymentBrick = lazy(() => import('./online-card-payment-brick'));

type Props = {
	chargeId: string;
	balanceInCents: number;
	option: OnlinePaymentOption;
	petName: string;
	returnHref: string;
	summary?: ReactNode;
	items?: readonly StatementItem[];
};

export function OnlinePaymentCheckout({
	chargeId,
	balanceInCents,
	option,
	petName,
	returnHref,
	summary,
	items,
}: Props) {
	const { refresh } = useRouter();
	const [amountMode, setAmountMode] = useState<'full' | 'partial'>('full');
	const { control, reset } = useForm<{ amount: string }>({ defaultValues: { amount: '' } });
	const partialInput = useWatch({ control, name: 'amount' });
	const partialAmount = Number(partialInput);
	const [method, setMethod] = useState<'pix' | 'credit_card'>('pix');
	const [localAttemptId, setAttemptId] = useState(option.attemptId);
	const attemptId = localAttemptId ?? option.attemptId;
	const [storedSnapshot, setSnapshot] = useState<OnlinePaymentSnapshot | null>(null);
	const snapshot = storedSnapshot?.attemptId === attemptId ? storedSnapshot : null;
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState('');
	const [uncertainStart, setUncertainStart] = useState(false);
	const [syncFailed, setSyncFailed] = useState(false);
	const mounted = useRef(false);
	const running = useRef(false);
	const startAttempted = useRef(false);
	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);
	const sync = useCallback(
		async (id: string) => {
			if (running.current || !mounted.current) return;
			running.current = true;
			setBusy(true);
			try {
				const result = await syncOnlinePayment({ attemptId: id });
				if (!mounted.current) return false;
				if (!result?.data || result.data.attemptId !== id) throw new Error('Consulta indisponível.');
				const next = result.data;
				setAttemptId(id);
				setSnapshot((previous) => ({
					...next,
					pix:
						next.pix ??
						(next.retainPix &&
						!next.remoteUnavailable &&
						next.status === 'pending' &&
						previous?.attemptId === next.attemptId &&
						previous.status === 'pending'
							? previous.pix
							: null),
				}));
				setSyncFailed(false);
				if (!isActivePaymentStatus(next.status)) {
					setMessage('');
					refresh();
					return false;
				}
				return true;
			} catch {
				if (!mounted.current) return false;
				// Não exibir dados Pix antigos se a consulta autorizada falhou.
				setSnapshot(null);
				setSyncFailed(true);
				return true;
			} finally {
				running.current = false;
				if (mounted.current) setBusy(false);
			}
		},
		[refresh],
	);
	const active = !snapshot || isActivePaymentStatus(snapshot.status);
	// Um único agendador por tentativa. O backend mantém o cooldown de 15 s para a API externa.
	useEffect(() => {
		if (!attemptId || !active) return;
		const id = attemptId;
		let stopped = false;
		let inFlight = false;
		let polls = 0;
		let timer: number | undefined;
		function clearTimer() {
			window.clearTimeout(timer);
		}
		function schedule(delay: number) {
			clearTimer();
			if (!stopped && document.visibilityState === 'visible') timer = window.setTimeout(() => void poll(), delay);
		}
		async function poll() {
			if (stopped || inFlight || document.visibilityState !== 'visible') return;
			inFlight = true;
			try {
				const keepWatching = await sync(id);
				if (keepWatching === false) stopped = true;
				else if (keepWatching !== undefined) polls += 1;
			} finally {
				inFlight = false;
				if (!stopped) schedule(polls < 5 ? 3000 : polls < 10 ? 5000 : polls < 20 ? 10000 : 15000);
			}
		}
		function resume() {
			clearTimer();
			if (!inFlight) schedule(0);
		}
		schedule(3000);
		document.addEventListener('visibilitychange', resume);
		window.addEventListener('focus', resume);
		return () => {
			stopped = true;
			clearTimer();
			document.removeEventListener('visibilitychange', resume);
			window.removeEventListener('focus', resume);
		};
	}, [attemptId, active, sync]);
	const amountInCents =
		amountMode === 'full'
			? balanceInCents
			: Number.isFinite(partialAmount) && partialAmount > 0 && partialAmount <= fromCents(balanceInCents)
				? toCents(partialAmount)
				: 0;
	const validAmount =
		Number.isSafeInteger(amountInCents) &&
		amountInCents > 0 &&
		amountInCents <= balanceInCents &&
		amountInCents <= 2147483647;
	const startPayment = useCallback(
		async (input: OnlinePaymentInput): Promise<boolean> => {
			if (
				!option.canStart ||
				!validAmount ||
				input.method !== method ||
				input.amountInCents !== amountInCents ||
				input.expectedBalanceInCents !== balanceInCents ||
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
				if (!mounted.current) return false;
				if (!result?.data) {
					setUncertainStart(true);
					setMessage(
						'Não foi possível confirmar a solicitação. Atualize a página antes de tentar novamente.',
					);
					refresh();
					return false;
				}
				setAttemptId(result.data.attemptId);
				setSnapshot(result.data.snapshot?.attemptId === result.data.attemptId ? result.data.snapshot : null);
				refresh();
				return true;
			} catch {
				if (!mounted.current) return false;
				setUncertainStart(true);
				setMessage('Não foi possível confirmar a solicitação. Atualize a página antes de tentar novamente.');
				refresh();
				return false;
			} finally {
				running.current = false;
				if (mounted.current) setBusy(false);
			}
		},
		[
			option.canStart,
			validAmount,
			method,
			amountInCents,
			balanceInCents,
			chargeId,
			attemptId,
			uncertainStart,
			refresh,
		],
	);
	async function copyPix(code: string) {
		try {
			await navigator.clipboard.writeText(code);
			setMessage('Código Pix copiado.');
		} catch {
			setMessage('Não foi possível copiar automaticamente. Selecione o código Pix.');
		}
	}
	const pix = snapshot?.status === 'pending' && !snapshot.remoteUnavailable ? snapshot.pix : null;
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
		setSyncFailed(false);
		setMessage('');
		setMethod('pix');
		setAmountMode('full');
		reset({ amount: '' });
	}
	const testNotice = option.testMode && (
		<p className='rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900'>
			Ambiente de homologação. Não utilize pagamentos reais.
		</p>
	);
	if (snapshot?.status === 'approved') {
		// A atualização do servidor deve confirmar saldo e elegibilidade antes de liberar nova operação.
		const canContinue =
			!busy &&
			option.canStart &&
			!option.attemptId &&
			snapshot.balanceInCents > 0 &&
			snapshot.balanceInCents === balanceInCents;
		const continuePayment = () => {
			if (!canContinue || running.current) return;
			startAttempted.current = false;
			setAttemptId(null);
			setSnapshot(null);
			setUncertainStart(false);
			setSyncFailed(false);
			setMessage('');
			setMethod('pix');
			setAmountMode('full');
			reset({ amount: '' });
		};
		const success = (
			<OnlinePaymentSuccess
				payment={snapshot}
				petName={petName}
				returnHref={returnHref}
				testMode={option.testMode}
				items={items}
				onContinue={canContinue ? continuePayment : undefined}
			/>
		);
		return summary ? (
			<OnlinePaymentLayout approved returnHref={returnHref}>
				{success}
			</OnlinePaymentLayout>
		) : (
			success
		);
	}
	const checkout = (
		<div className='min-w-0 space-y-4'>
			{testNotice}
			<div className='rounded-lg bg-muted/50 p-3'>
				<p className='text-xs text-muted-foreground'>{attemptId ? 'Valor da tentativa' : 'Saldo atual'}</p>
				<p className='text-xl font-semibold tabular-nums'>
					{formatCurrencyFromCents(snapshot?.amountInCents ?? balanceInCents)}
				</p>
			</div>
			{attemptId ? (
				<div className='space-y-3'>
					{snapshot?.status === 'rejected' ? (
						<div
							role='alert'
							className='space-y-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'
						>
							<p className='flex items-center gap-2 font-semibold'>
								<CircleX aria-hidden='true' className='size-5 shrink-0' />
								Pagamento recusado.
							</p>
							<p>
								Não foi possível concluir o pagamento. Nenhum pagamento foi registrado nesta tentativa.
							</p>
							{canRetry ? (
								<p>Você pode tentar novamente com outro cartão ou escolher outra forma de pagamento.</p>
							) : (
								<p>Consulte a situação antes de iniciar outro pagamento.</p>
							)}
						</div>
					) : snapshot?.status === 'review' ? (
						<div
							role='alert'
							className='space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
						>
							<p className='flex items-center gap-2 font-semibold'>
								<ShieldAlert aria-hidden='true' className='size-5 shrink-0' />
								Pagamento em análise
							</p>
							<p>Ainda não foi possível confirmar o resultado do seu pagamento na clínica.</p>
							<p>Para evitar cobranças duplicadas, não realize outro pagamento neste momento.</p>
							<p>Entre em contato com a clínica para verificar a situação.</p>
						</div>
					) : (
						<p role='status' className='text-sm font-medium'>
							{snapshot ? paymentStatusMessage(snapshot.status) : 'Consultando situação do pagamento…'}
						</p>
					)}
					{active && !syncFailed && !snapshot?.remoteUnavailable && (
						<div className='flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground'>
							<LoaderCircle
								aria-hidden='true'
								className='mt-0.5 size-4 shrink-0 motion-safe:animate-spin'
							/>
							<p>Estamos acompanhando seu pagamento. A situação será atualizada automaticamente.</p>
						</div>
					)}
					{syncFailed && (
						<p role='status' className='text-sm text-muted-foreground'>
							Não foi possível consultar o pagamento. Estamos tentando novamente. Não inicie outro
							pagamento.
						</p>
					)}
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
					{active && (syncFailed || snapshot?.remoteUnavailable) && (
						<Button
							type='button'
							variant='outline'
							className='w-full'
							disabled={busy}
							onClick={() => void sync(attemptId)}
						>
							{busy ? 'Consultando…' : 'Atualizar situação'}
						</Button>
					)}
					{canRetry && (
						<Button type='button' className='w-full' onClick={retryPayment}>
							Tentar outro pagamento
						</Button>
					)}
				</div>
			) : (
				<div className='space-y-3'>
					<fieldset className='space-y-3' disabled={busy || uncertainStart}>
						<legend className='text-sm font-medium'>Valor do pagamento</legend>
						<label className='flex items-center gap-2 text-sm'>
							<input
								type='radio'
								name='payment-amount-mode'
								checked={amountMode === 'full'}
								onChange={() => setAmountMode('full')}
							/>{' '}
							Pagar saldo total
						</label>
						<label className='flex items-center gap-2 text-sm'>
							<input
								type='radio'
								name='payment-amount-mode'
								checked={amountMode === 'partial'}
								onChange={() => setAmountMode('partial')}
							/>{' '}
							Pagar outro valor
						</label>
						{amountMode === 'partial' && (
							<MoneyInputForm
								control={control}
								name='amount'
								label='Valor desejado'
								preserveNumericString
								placeholder='R$ 0,00'
								inputMode='decimal'
								disabled={busy || uncertainStart}
								error={
									partialInput !== '' && !validAmount
										? `Informe um valor positivo de até ${formatCurrencyFromCents(balanceInCents)}.`
										: undefined
								}
							/>
						)}
						{validAmount && (
							<div className='space-y-1 rounded-lg bg-muted/50 p-3 text-sm'>
								<p className='flex justify-between gap-2'>
									<span>Valor deste pagamento</span>
									<strong>{formatCurrencyFromCents(amountInCents)}</strong>
								</p>
								<p className='flex justify-between gap-2'>
									<span>Saldo após confirmação</span>
									<strong>{formatCurrencyFromCents(balanceInCents - amountInCents)}</strong>
								</p>
								{amountInCents < balanceInCents && (
									<p className='text-muted-foreground'>
										Você poderá pagar o saldo restante posteriormente, utilizando outra forma de
										pagamento.
									</p>
								)}
							</div>
						)}
					</fieldset>
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
							disabled={!option.canStart || !validAmount || busy || uncertainStart}
							onClick={() =>
								void startPayment({
									chargeId,
									method: 'pix',
									expectedBalanceInCents: balanceInCents,
									amountInCents,
								})
							}
						>
							{busy ? 'Solicitando…' : 'Gerar Pix'}
						</Button>
					) : (
						!uncertainStart &&
						validAmount && (
							<Suspense
								fallback={
									<p role='status' className='text-sm text-muted-foreground'>
										Carregando pagamento com cartão…
									</p>
								}
							>
								<OnlineCardPaymentBrick
									key={`${chargeId}:${balanceInCents}:${amountInCents}`}
									chargeId={chargeId}
									balanceInCents={balanceInCents}
									amountInCents={amountInCents}
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
	return summary ? (
		<OnlinePaymentLayout summary={summary} returnHref={returnHref}>
			{checkout}
		</OnlinePaymentLayout>
	) : (
		checkout
	);
}

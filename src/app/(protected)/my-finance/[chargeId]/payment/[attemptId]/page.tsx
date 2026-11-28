import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requirePageAccess } from '@/lib/security/authorization';
import { getOwnFinancialCharge } from '@/lib/finance/financial-report-queries';
import { getOwnStatementItems } from '@/lib/finance/customer-statement-queries';
import { resolveStatementMonth } from '@/lib/finance/customer-statement';
import { getOwnOnlineReceipt } from '@/lib/finance/online-payment-receipts';
import { OnlinePaymentLayout } from '../../../_components/online-payment-layout';
import { OnlinePaymentSuccess } from '../../../_components/online-payment-success';

export default async function PaymentReceiptPage({
	params,
	searchParams,
}: {
	params: Promise<{ chargeId: string; attemptId: string }>;
	searchParams: Promise<{ month?: string | string[]; scope?: string | string[] }>;
}) {
	const context = await requirePageAccess('/my-finance');
	if (context.role !== 'customer' || !context.customerId) notFound();
	const { chargeId, attemptId } = await params;
	if (!z.uuid().safeParse(chargeId).success || !z.uuid().safeParse(attemptId).success) notFound();
	const { month, scope } = await searchParams;
	const selected = resolveStatementMonth(month);
	const selectedScope = scope === 'all' ? 'all' : 'month';
	const charge = await getOwnFinancialCharge(selected, chargeId);
	if (!charge) notFound();
	const receipt = await getOwnOnlineReceipt(context, chargeId, attemptId);
	if (!receipt) notFound();
	const items = await getOwnStatementItems([chargeId]);
	const returnHref = `/my-finance?month=${selected}&scope=${selectedScope}`;
	return (
		<OnlinePaymentLayout approved returnHref={returnHref}>
			<OnlinePaymentSuccess
				payment={receipt.payment}
				petName={charge.petName}
				returnHref={returnHref}
				testMode={receipt.testMode}
				items={items.get(chargeId) ?? []}
				historical
				receivedAtLabel={new Intl.DateTimeFormat('pt-BR', {
					dateStyle: 'short',
					timeStyle: 'short',
					timeZone: 'America/Campo_Grande',
				}).format(receipt.receivedAt)}
			/>
		</OnlinePaymentLayout>
	);
}

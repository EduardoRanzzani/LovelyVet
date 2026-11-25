'use server';

import { z } from 'zod';
import { refreshOnlinePayment } from '@/server/payments/payment-recovery.service';
import { onlinePaymentSchema } from '@/api/schema/online-payment.schema';
import { actionClient } from '@/lib/next-safe-action';
import { requireAuthContext } from '@/lib/security/auth-context';
import { createOnlinePayment } from '@/server/payments/payment.service';

export const startOnlinePayment = actionClient.schema(onlinePaymentSchema).action(async ({ parsedInput }) => {
	const context = await requireAuthContext();
	return createOnlinePayment(context, parsedInput);
});

export const syncOnlinePayment = actionClient
	.schema(z.object({ attemptId: z.uuid() }).strict())
	.action(async ({ parsedInput }) => {
		const context = await requireAuthContext();
		return refreshOnlinePayment(context, parsedInput.attemptId);
	});

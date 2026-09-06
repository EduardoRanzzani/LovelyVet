'use server';

import { WhatsappPayload } from '@/api/schema/whatsapp.schema';
import { sendWhatsappMessageInternal } from '@/lib/integrations/whatsapp';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireAdmin } from '@/lib/security/authorization';

export const sendWhatsappMessage = async (payload: WhatsappPayload) => {
	const context = await requireAuthContext();
	requireAdmin(context);
	return sendWhatsappMessageInternal(payload);
};

'use server';

import { EmailSchema } from '@/api/schema/emails.schema';
import { sendEmailMessage } from '@/lib/integrations/email';
import { requireAuthContext } from '@/lib/security/auth-context';
import { requireAdmin } from '@/lib/security/authorization';

export const sendEmailAction = async (data: EmailSchema) => {
	const context = await requireAuthContext();
	requireAdmin(context);
	return sendEmailMessage(data);
};

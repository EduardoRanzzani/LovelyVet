import { db } from '@/db';
import { careRemindersTable, petTutorsTable } from '@/db/schema';
import { and, eq, exists, type SQL } from 'drizzle-orm';
import type { AuthContext } from './auth-context';

/** Limita consultas de lembretes ao veterinário ou aos pets do tutor autenticado. */
export const buildCareReminderAccessCondition = (
  context: AuthContext,
): SQL | undefined => {
  if (context.role === 'admin') return undefined;

  if (context.role === 'doctor') {
    if (!context.doctorId) throw new Error('Perfil de veterinário não encontrado');
    return eq(careRemindersTable.doctorId, context.doctorId);
  }

  if (context.role === 'customer') {
    if (!context.customerId) throw new Error('Perfil de cliente não encontrado');
    return exists(
      db.select({ petId: petTutorsTable.petId })
        .from(petTutorsTable)
        .where(and(
          eq(petTutorsTable.petId, careRemindersTable.petId),
          eq(petTutorsTable.customerId, context.customerId),
        )),
    );
  }

  throw new Error('Perfil não autorizado');
};

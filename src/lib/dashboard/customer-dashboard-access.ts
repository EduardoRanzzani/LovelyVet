import type { AuthContext } from '@/lib/security/auth-context';
import { buildPetAccessCondition } from '@/lib/security/pet-access';
import { buildAppointmentAccessCondition } from '@/lib/security/appointment-access';
import { buildCareReminderAccessCondition } from '@/lib/security/care-reminder-access';
import { requireCustomerDashboardScope } from './customer-dashboard';

/** Todas as condições são derivadas do contexto autenticado, sem IDs externos. */
export function buildCustomerDashboardAccess(context: AuthContext) {
 requireCustomerDashboardScope(context);
 return {
  pets: buildPetAccessCondition(context),
  appointments: buildAppointmentAccessCondition(context),
  reminders: buildCareReminderAccessCondition(context),
 };
}

import 'server-only';
import { db } from '@/db';
import { appointmentsTable, careRemindersTable, petsTable, shiftsTable } from '@/db/schema';
import { requireAuthContext } from '@/lib/security/auth-context';
import { getMonthBounds } from '@/lib/finance/financial-report';
import { and, asc, count, eq, gt, gte, isNull, lt } from 'drizzle-orm';
import { resolveAdminMonth, summarizeAppointments } from './admin-dashboard';
import { getDoctorShiftSummary } from './doctor-shift-summary';
import { getDoctorDashboardScope, getDoctorDashboardWindow, summarizeDoctorReminders, summarizeDoctorRoutine } from './doctor-dashboard';

/** O escopo é sempre derivado do usuário autenticado, nunca da URL. */
export async function getDoctorDashboard(requestedMonth?: string) {
 const doctorId = getDoctorDashboardScope(await requireAuthContext());
 const now = new Date();
 const month = resolveAdminMonth(requestedMonth, now);
 const { start, end } = getMonthBounds(month);
 const window = getDoctorDashboardWindow(now);
 const shiftColumns = {
  id: shiftsTable.id, clinicName: shiftsTable.clinicName, startTime: shiftsTable.startTime,
  endTime: shiftsTable.endTime, amountInCents: shiftsTable.amountInCents, isPaid: shiftsTable.isPaid,
 };
 const [monthlyShifts, nextShifts, monthlyAppointments, routineAppointments, pending, reminders] = await Promise.all([
  db.select(shiftColumns).from(shiftsTable)
   .where(and(eq(shiftsTable.doctorId, doctorId), lt(shiftsTable.startTime, end), gt(shiftsTable.endTime, start))),
  db.select(shiftColumns).from(shiftsTable)
   .where(and(eq(shiftsTable.doctorId, doctorId), gt(shiftsTable.startTime, now), lt(shiftsTable.startTime, window.end)))
   .orderBy(asc(shiftsTable.startTime)).limit(5),
  db.select({ scheduledAt: appointmentsTable.scheduledAt, status: appointmentsTable.status }).from(appointmentsTable)
   .where(and(eq(appointmentsTable.doctorId, doctorId), gte(appointmentsTable.scheduledAt, start), lt(appointmentsTable.scheduledAt, end))),
  db.query.appointmentsTable.findMany({
   columns: { id: true, petId: true, scheduledAt: true, status: true },
   where: and(eq(appointmentsTable.doctorId, doctorId), gte(appointmentsTable.scheduledAt, window.start), lt(appointmentsTable.scheduledAt, window.end)),
   orderBy: asc(appointmentsTable.scheduledAt),
   with: { pet: { columns: { name: true } }, items: { columns: {}, with: { service: { columns: { name: true } } } } },
  }),
  db.select({ total: count() }).from(appointmentsTable)
   .where(and(eq(appointmentsTable.doctorId, doctorId), eq(appointmentsTable.status, 'pending'))),
  db.select({ id: careRemindersTable.id, petId: careRemindersTable.petId, petName: petsTable.name, title: careRemindersTable.title, dueDate: careRemindersTable.dueDate })
   .from(careRemindersTable).innerJoin(petsTable, eq(careRemindersTable.petId, petsTable.id))
   .where(and(eq(careRemindersTable.doctorId, doctorId), eq(careRemindersTable.status, 'pending'), isNull(careRemindersTable.appointmentId), eq(petsTable.status, 'alive'), lt(careRemindersTable.dueDate, window.endDate)))
   .orderBy(asc(careRemindersTable.dueDate)),
 ]);
 const routine = summarizeDoctorRoutine(routineAppointments, now);
 return {
  month, today: window.today,
  shifts: getDoctorShiftSummary(monthlyShifts, now), nextShifts,
  appointments: summarizeAppointments(monthlyAppointments, month),
  routine: { ...routine, upcoming: routine.upcoming.slice(0, 5) },
  pendingConfirmations: pending[0].total,
  reminders: summarizeDoctorReminders(reminders, now),
 };
}

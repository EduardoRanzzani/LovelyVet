import { getDoctorDashboardWindow } from './doctor-dashboard';
import type { AuthContext } from '@/lib/security/auth-context';

export function requireCustomerDashboardScope(context: AuthContext): string {
	if (context.role !== 'customer' || !context.customerId) {
		throw new Error('Perfil de tutor não autorizado para o dashboard.');
	}
	return context.customerId;
}

export function getCustomerDashboardWindow(now: Date) {
	const { today, end, endDate } = getDoctorDashboardWindow(now);
	return { today, month: today.slice(0, 7), end, endDate };
}

export const petCountLabel = (count: number) => `${count} ${count === 1 ? 'pet vinculado' : 'pets vinculados'}`;
export const chargeCountLabel = (count: number) =>
	`${count} ${count === 1 ? 'cobrança em aberto' : 'cobranças em aberto'}`;

export function getPetAgeLabel(birthDate: string, today: string): string {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || birthDate > today) return 'Idade não informada';
	const [year, month, day] = birthDate.split('-').map(Number);
	const [currentYear, currentMonth, currentDay] = today.split('-').map(Number);
	const months = (currentYear - year) * 12 + currentMonth - month - (currentDay < day ? 1 : 0);
	const years = Math.floor(months / 12);
	if (years > 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`;
	if (months > 0) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
	return 'Menos de 1 mês';
}

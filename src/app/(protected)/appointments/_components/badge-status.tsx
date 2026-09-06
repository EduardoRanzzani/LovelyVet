import { convertAppointmentStatus } from '@/api/config/consts';
import { Badge } from '@/components/ui/badge';
import type { AppointmentListItem } from '@/api/schema/appointments.schema';

interface BadgeStatusProps {
	appointment: Pick<AppointmentListItem, 'status'>;
}

const BadgeStatus = ({ appointment }: BadgeStatusProps) => {
	const variant = () => {
		switch (appointment.status) {
			case 'completed':
				return 'default';
			case 'confirmed':
				return 'secondary';
			case 'cancelled':
				return 'destructive';
			default:
				return 'outline';
		}
	};

	return (
		<Badge variant={variant()}>
			{convertAppointmentStatus(appointment.status)}
		</Badge>
	);
};

export default BadgeStatus;

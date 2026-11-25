import { cn } from '@/lib/utils';
import { BanIcon, CheckIcon } from 'lucide-react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '../ui/alert-dialog';
import { Button, buttonVariants } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface ConfirAlertButtonProps {
	variant?: 'default' | 'outline' | 'secondary';
	tooltip?: string;
	text?: string;
	size?: 'default' | 'icon';
	disabled?: boolean;
	action: () => void;
}

const ConfirmAlertButton = ({
	action,
	text,
	tooltip = 'Confirmar',
	variant,
	size,
	disabled = false,
}: ConfirAlertButtonProps) => {
	return (
		<AlertDialog>
			<Tooltip>
				<TooltipTrigger asChild>
					<AlertDialogTrigger asChild>
						<Button variant={variant} size={size} disabled={disabled}>
							<CheckIcon />
							{size === 'icon' || text}
						</Button>
					</AlertDialogTrigger>
				</TooltipTrigger>
				<TooltipContent>{tooltip}</TooltipContent>
			</Tooltip>

			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
					<AlertDialogDescription>Essa ação não poderá ser desfeita.</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter className='grid grid-cols-2 gap-3 sm:space-x-0'>
					<AlertDialogCancel
						className={cn(
							buttonVariants({
								variant: 'destructive',
								size: 'default',
							}),
							'mt-0 w-full hover:bg-destructive/90 hover:text-white', // 'mt-0' remove a margem padrão do mobile
						)}
					>
						<BanIcon className='mr-2 h-4 w-4' />
						Cancelar
					</AlertDialogCancel>

					<AlertDialogAction onClick={() => action()} className='w-full'>
						<CheckIcon className='mr-2 h-4 w-4' />
						Confirmar
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default ConfirmAlertButton;

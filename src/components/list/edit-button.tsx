'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PencilIcon } from 'lucide-react';
import { ReactElement, useState } from 'react';

interface EditButtonProps {
	variant?: 'default' | 'outline' | 'secondary';
	tooltip?: string;
	text?: string;
	size?: 'default' | 'icon';
	disabled?: boolean;
	renderForm: (onSuccess: () => void) => ReactElement;
}

const EditButton = ({
	renderForm,
	variant = 'default',
	size = 'icon',
	text,
	tooltip = 'Editar',
	disabled = false,
}: EditButtonProps) => {
	const [isOpen, setIsOpen] = useState<boolean>(false);

	const handleSuccess = () => setIsOpen(false);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<Tooltip>
				<TooltipTrigger asChild>
					<DialogTrigger asChild>
						<Button size={size} variant={variant} disabled={disabled}>
							<PencilIcon className='h-4 w-4' />
							{size !== 'icon' && <span className='text-xs'>{text}</span>}
						</Button>
					</DialogTrigger>
				</TooltipTrigger>
				<TooltipContent>{tooltip}</TooltipContent>
			</Tooltip>

			{isOpen && renderForm(handleSuccess)}
		</Dialog>
	);
};

export default EditButton;

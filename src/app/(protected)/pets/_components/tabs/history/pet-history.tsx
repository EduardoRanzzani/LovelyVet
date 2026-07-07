'use client';

import { TimelineItemPerson } from '@/api/schema/timeline.schema';
import DOMPurify from 'dompurify';
import { getInitials } from '@/api/util';
import DeleteAlertButton from '@/components/list/delete-alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoryItemProps {
	title: string;
	date: Date;
	icon: React.ReactNode;
	colorClass: string;
	content: React.ReactNode;
	avatarPerson?: TimelineItemPerson;
	canDelete?: boolean;
	onDelete?: () => void;
}

export const HistoryItem = ({
	title,
	date,
	icon,
	colorClass,
	content,
	avatarPerson,
	canDelete,
	onDelete,
}: HistoryItemProps) => {
	return (
		<div className='flex gap-4 mb-8 relative group'>
			{/* Linha vertical da timeline */}
			<div className='absolute left-5 top-10 -bottom-8 w-0.5 bg-muted last:hidden' />

			{/* Ícone */}
			<div
				className={`z-10 flex items-center justify-center w-10 h-10 rounded-full shrink-0 shadow-md ${colorClass} border`}
			>
				{icon}
			</div>

			{/* Conteúdo */}
			<div
				className={cn(
					'flex flex-col gap-1 w-full border rounded-lg p-4 shadow-md relative',
					`${colorClass}`,
				)}
			>
				<div className='flex justify-between items-start gap-2'>
					<div className='flex gap-3 flex-1 min-w-0 items-start pr-2'>
						<span className='flex items-center gap-2 '>
							{avatarPerson ? (
								<Tooltip>
									<TooltipTrigger asChild>
										<Avatar
											className='h-10 w-10 rounded-full shrink-0'
											draggable={false}
										>
											{avatarPerson.image ? (
												<AvatarImage
													src={avatarPerson.image}
													alt={avatarPerson.name}
													draggable={false}
													className='object-cover'
												/>
											) : null}
											<AvatarFallback className='rounded-full text-xs'>
												{getInitials(avatarPerson.name)}
											</AvatarFallback>
										</Avatar>
									</TooltipTrigger>
									<TooltipContent>
										{avatarPerson.name ? <p>{avatarPerson.name}</p> : null}
									</TooltipContent>
								</Tooltip>
							) : null}
							<div className='flex flex-col min-w-0 flex-1'>
								<h4 className='font-bold text-sm'>{title}</h4>
								<p className='text-[10px] font-medium uppercase text-muted-foreground'>
									{format(date, "dd 'de' MMMM 'de' yyyy - HH:mm", {
										locale: ptBR,
									})}
								</p>
							</div>
						</span>
					</div>

					{canDelete && (
						<DeleteAlertButton
							disabled={!canDelete}
							action={() => onDelete?.()}
						/>
					)}
				</div>
				<Separator className='mt-2' />

				<div
					className='prose prose-sm dark:prose-invert max-w-none'
					dangerouslySetInnerHTML={{
						__html: DOMPurify.sanitize(content as string),
					}}
				/>
			</div>
		</div>
	);
};

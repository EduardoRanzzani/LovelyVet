'use client';
import { TimelineItemPerson } from '@/api/schema/timeline.schema';
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
		<div className='group relative mb-5 flex min-w-0 gap-2 sm:mb-8 sm:gap-4'>
			{/* Linha vertical da timeline */}
			<div className='absolute -bottom-5 left-4 top-8 w-0.5 bg-muted sm:-bottom-8 sm:left-5 sm:top-10' />

			{/* Ícone */}
			<div
				className={`z-10 flex size-8 shrink-0 items-center justify-center rounded-full border shadow-md sm:size-10 ${colorClass}`}
			>
				{icon}
			</div>

			{/* Conteúdo */}
			<div
				className={cn(
					'relative flex min-w-0 flex-1 flex-col gap-1 rounded-lg border p-3 shadow-md sm:p-4',
					`${colorClass}`,
				)}
			>
				<div className='flex min-w-0 items-start justify-between gap-2'>
					<div className='flex min-w-0 flex-1 items-start gap-2 sm:gap-3'>
						<div className='flex min-w-0 flex-1 items-center gap-2'>
							{avatarPerson ? (
								<Tooltip>
									<TooltipTrigger asChild>
										<Avatar
											className='size-8 shrink-0 rounded-full sm:size-10'
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
							<div className='flex min-w-0 flex-1 flex-col'>
								<h4 className='break-words text-sm font-bold'>{title}</h4>
								<p className='text-[10px] font-medium text-muted-foreground sm:uppercase'>
									<span className='sm:hidden'>
										{format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
									</span>
									<span className='hidden sm:inline'>
										{format(date, "dd 'de' MMMM 'de' yyyy - HH:mm", {
											locale: ptBR,
										})}
									</span>
								</p>
							</div>
						</div>
					</div>

					{canDelete && (
						<DeleteAlertButton
							disabled={!canDelete}
							action={() => onDelete?.()}
						/>
					)}
				</div>
				<Separator className='mt-2' />

				{/* <div
					className='prose prose-sm dark:prose-invert max-w-none'
					dangerouslySetInnerHTML={{
						__html: content as string,
					}}
				/> */}
				<div className='min-w-0 overflow-x-auto break-words text-sm [overflow-wrap:anywhere] [&_*]:max-w-full'>
					{content}
				</div>
			</div>
		</div>
	);
};

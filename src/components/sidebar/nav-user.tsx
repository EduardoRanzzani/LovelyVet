'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { useAuth, useClerk } from '@clerk/nextjs';
import { EllipsisVerticalIcon, LogOutIcon, UserIcon } from 'lucide-react';

export type NavUserType = {
	image: string;
	name: string;
	email: string;
};

interface NavUserProps {
	user: NavUserType;
}

export function NavUser({ user }: NavUserProps) {
	const { isMobile } = useSidebar();
	const { signOut } = useAuth();
	const { openUserProfile } = useClerk();

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size='lg'
							className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
						>
							<Avatar className='h-8 w-8 rounded-full'>
								<AvatarImage src={user?.image as string} alt={user?.name as string} />
								<AvatarFallback className='rounded-lg'>LV</AvatarFallback>
							</Avatar>
							<div className='grid flex-1 text-left text-sm leading-tight'>
								<span className='truncate font-medium'>{user?.name}</span>
								<span className='text-muted-foreground truncate text-xs'>{user?.email}</span>
							</div>
							<EllipsisVerticalIcon className='ml-auto size-4' />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
						side={isMobile ? 'bottom' : 'right'}
						align='end'
						sideOffset={4}
					>
						<DropdownMenuLabel className='p-0 font-normal'>
							<div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
								<Avatar className='h-8 w-8 rounded-full'>
									<AvatarImage src={user?.image as string} alt={user?.name as string} />
									<AvatarFallback className='rounded-lg'>LV</AvatarFallback>
								</Avatar>
								<div className='grid flex-1 text-left text-sm leading-tight'>
									<span className='truncate font-medium'>{user?.name}</span>
									<span className='text-muted-foreground truncate text-xs'>{user?.email}</span>
								</div>
							</div>
						</DropdownMenuLabel>

						<DropdownMenuSeparator />

						<DropdownMenuItem onClick={() => openUserProfile()}>
							<UserIcon className='mr-2 size-4' />
							<span>Meus Dados</span>
						</DropdownMenuItem>

						<DropdownMenuSeparator />

						<DropdownMenuItem onClick={() => signOut()}>
							<LogOutIcon />
							Sair
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

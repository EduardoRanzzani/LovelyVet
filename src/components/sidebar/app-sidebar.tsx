'use client';

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@/components/ui/sidebar';
import { canAccessPath } from '@/lib/security/permissions';
import type { UserRole } from '@/lib/security/roles';
import { useUser } from '@clerk/nextjs';
import {
	CalculatorIcon,
	CalendarIcon,
	CalendarDaysIcon,
	ChevronRightIcon,
	CogIcon,
	HospitalIcon,
	LayoutDashboardIcon,
	ListIcon,
	LucideIcon,
	MessageSquareIcon,
	PawPrintIcon,
	ScrollTextIcon,
	ShieldUserIcon,
	StethoscopeIcon,
	UsersRoundIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import packageJson from '../../../package.json';
import { NavUser, NavUserType } from './nav-user';

interface SidebarItem {
	title: string;
	url: string;
	icon: LucideIcon;
}

interface AppSidebarProps {
	role: UserRole;
}

const AppSidebar = ({ role }: AppSidebarProps) => {
	const { user } = useUser();
	const { setOpenMobile } = useSidebar();

	const navUser: NavUserType = {
		image: user?.imageUrl as string,
		name: user?.fullName as string,
		email: user?.primaryEmailAddress?.emailAddress as string,
	};

	const pathname = usePathname();

	const items: SidebarItem[] = [
		{
			title: 'Dashboard',
			url: '/dashboard',
			icon: LayoutDashboardIcon,
		},
		{
			title: 'Veterinários',
			url: '/doctors',
			icon: StethoscopeIcon,
		},
		{
			title: 'Pets',
			url: '/pets',
			icon: PawPrintIcon,
		},
		{
			title: 'Clientes',
			url: '/customers',
			icon: UsersRoundIcon,
		},
		{
			title: 'Agendamentos',
			url: '/appointments',
			icon: CalendarIcon,
		},
		{
			title: 'Agenda',
			url: '/agenda',
			icon: CalendarDaysIcon,
		},
		{
			title: 'Plantões',
			url: '/shifts',
			icon: HospitalIcon,
		},
		{
			title: 'Mensagens',
			url: '/messages',
			icon: MessageSquareIcon,
		},
	];

	const helpers: SidebarItem[] = [
		{
			title: 'Identidades Clerk',
			url: '/admin',
			icon: ShieldUserIcon,
		},
		{
			title: 'Clínicas',
			url: '/clinics',
			icon: HospitalIcon,
		},
		{
			title: 'Calculadoras',
			url: '/calculators',
			icon: CalculatorIcon,
		},
		{
			title: 'Itens de Receitas',
			url: '/prescriptions-items',
			icon: ListIcon,
		},
		{
			title: 'Receitas',
			url: '/prescriptions',
			icon: ScrollTextIcon,
		},
	];

	const settings: SidebarItem[] = [
		{
			title: 'Serviços',
			url: '/services',
			icon: CogIcon,
		},
		{
			title: 'Espécies',
			url: '/species',
			icon: CogIcon,
		},
		{
			title: 'Raças',
			url: '/breeds',
			icon: CogIcon,
		},
	];

	const visibleHelpers = helpers.filter((item) => canAccessPath(role, item.url));

	const visibleSettings = settings.filter((item) =>
		canAccessPath(role, item.url),
	);

	const isLinkActive = (url: string) => {
		if (url === '/dashboard') {
			return pathname === '/dashboard';
		}
		return pathname === url || pathname.startsWith(`${url}/`);
	};

	return (
		<Sidebar variant='inset' collapsible='offcanvas'>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<Link href={'/dashboard'} onClick={() => setOpenMobile(false)}>
							<span className='flex items-center gap-2 text-3xl'>
								<StethoscopeIcon className='h-7 w-7' />
								<span>LovelyVet</span>
							</span>
						</Link>
						<SidebarGroupLabel>v. {packageJson.version}</SidebarGroupLabel>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
					<SidebarMenu>
						{items
							.filter((item) => canAccessPath(role, item.url))
							.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild isActive={isLinkActive(item.url)}>
										<Link
											href={item.url}
											className='flex justify-between'
											onClick={() => setOpenMobile(false)}
										>
											<span className='flex items-center gap-2'>
												<item.icon className='h-5 w-5' />
												<p
													className={`${isLinkActive(item.url) && 'font-semibold'}`}
												>
													{item.title}
												</p>
											</span>
											{isLinkActive(item.url) && <ChevronRightIcon />}
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
					</SidebarMenu>
				</SidebarGroup>
				{visibleHelpers.length > 0 && (
					<>
						<SidebarGroup>
							<SidebarGroupLabel>Helpers</SidebarGroupLabel>
							<SidebarMenu>
								{visibleHelpers.map((item) => (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											asChild
											isActive={isLinkActive(item.url)}
										>
											<Link
												href={item.url}
												className='flex justify-between'
												onClick={() => setOpenMobile(false)}
											>
												<span className='flex items-center gap-2'>
													<item.icon className='h-5 w-5' />
													<p
														className={`${isLinkActive(item.url) && 'font-semibold'}`}
													>
														{item.title}
													</p>
												</span>
												{isLinkActive(item.url) && <ChevronRightIcon />}
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroup>

						{visibleSettings.length > 0 && (
							<SidebarGroup>
								<SidebarGroupLabel>Configurações</SidebarGroupLabel>
								<SidebarMenu>
									{visibleSettings.map((item) => (
										<SidebarMenuItem key={item.title}>
											<SidebarMenuButton
												asChild
												isActive={isLinkActive(item.url)}
											>
												<Link
													href={item.url}
													className='flex justify-between'
													onClick={() => setOpenMobile(false)}
												>
													<span className='flex items-center gap-2'>
														<item.icon className='h-5 w-5' />
														<p
															className={`${isLinkActive(item.url) && 'font-semibold'}`}
														>
															{item.title}
														</p>
													</span>
													{isLinkActive(item.url) && <ChevronRightIcon />}
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									))}
								</SidebarMenu>
							</SidebarGroup>
						)}
					</>
				)}
				<SidebarGroup />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={navUser} />
			</SidebarFooter>
		</Sidebar>
	);
};

export default AppSidebar;

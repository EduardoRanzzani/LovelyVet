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
import { useUser } from '@clerk/nextjs';
import {
	CalculatorIcon,
	CalendarIcon,
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
import { version } from '../../../package.json';
import { NavUser, NavUserType } from './nav-user';

interface SidebarItem {
	title: string;
	url: string;
	icon: LucideIcon;
	roles: string[];
}

const AppSidebar = () => {
	const { user } = useUser();
	const { setOpenMobile } = useSidebar();

	const navUser: NavUserType = {
		image: user?.imageUrl as string,
		name: user?.fullName as string,
		email: user?.primaryEmailAddress?.emailAddress as string,
	};

	const userRole = (user?.publicMetadata?.role as string) || 'customer';
	console.log(userRole);
	const pathname = usePathname();

	const items: SidebarItem[] = [
		{
			title: 'Dashboard',
			url: '/dashboard',
			icon: LayoutDashboardIcon,
			roles: ['admin', 'customer', 'doctor'],
		},
		{
			title: 'Veterinários',
			url: '/doctors',
			icon: StethoscopeIcon,
			roles: ['admin'],
		},
		{
			title: 'Pets',
			url: '/pets',
			icon: PawPrintIcon,
			roles: ['admin', 'doctor', 'customer'],
		},
		{
			title: 'Clientes',
			url: '/customers',
			icon: UsersRoundIcon,
			roles: ['admin', 'doctor'],
		},
		{
			title: 'Agendamentos',
			url: '/appointments',
			icon: CalendarIcon,
			roles: ['admin', 'doctor', 'customer'],
		},
		{
			title: 'Plantões',
			url: '/shifts',
			icon: HospitalIcon,
			roles: ['admin', 'doctor'],
		},
		{
			title: 'Mensagens',
			url: '/messages',
			icon: MessageSquareIcon,
			roles: ['admin'],
		},
	];

	const helpers: SidebarItem[] = [
		{
			title: 'Alterar Cadastro',
			url: '/admin',
			icon: ShieldUserIcon,
			roles: ['admin'],
		},
		{
			title: 'Clínicas',
			url: '/clinics',
			icon: HospitalIcon,
			roles: ['admin'],
		},
		{
			title: 'Calculadoras',
			url: '/calculators',
			icon: CalculatorIcon,
			roles: ['admin', 'doctor'],
		},
		{
			title: 'Itens de Receitas',
			url: '/prescriptions-items',
			icon: ListIcon,
			roles: ['admin', 'doctor'],
		},
		{
			title: 'Receitas',
			url: '/prescriptions',
			icon: ScrollTextIcon,
			roles: ['admin', 'doctor'],
		},
	];

	const settings: SidebarItem[] = [
		{
			title: 'Serviços',
			url: '/services',
			icon: CogIcon,
			roles: ['admin', 'doctor'],
		},
		{
			title: 'Espécies',
			url: '/species',
			icon: CogIcon,
			roles: ['admin', 'doctor'],
		},
		{
			title: 'Raças',
			url: '/breeds',
			icon: CogIcon,
			roles: ['admin', 'doctor'],
		},
	];

	const visibleHelpers = helpers.filter((item) =>
		item.roles.includes(userRole),
	);

	const visibleSettings = settings.filter((item) =>
		item.roles.includes(userRole),
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
						<SidebarGroupLabel>v. {version}</SidebarGroupLabel>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
					<SidebarMenu>
						{items
							.filter((item) => item.roles.includes(userRole))
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

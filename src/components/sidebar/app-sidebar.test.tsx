import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { UserRole } from '@/lib/security/roles';
import packageJson from '../../../package.json';
import AppSidebar from './app-sidebar';

vi.mock('@clerk/nextjs', () => ({ useUser: () => ({ user: null }) }));
vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('./nav-user', () => ({ NavUser: () => null }));

describe('AppSidebar', () => {
	it.each<UserRole>(['admin', 'doctor', 'customer'])('mostra a versão somente para admin (perfil %s)', (role) => {
		render(
			<SidebarProvider>
				<AppSidebar role={role} />
			</SidebarProvider>,
		);
		expect(screen.getByText('LovelyVet')).toBeInTheDocument();
		const version = screen.queryByText(`v. ${packageJson.version}`);
		if (role === 'admin') {
			expect(version).toBeInTheDocument();
		} else {
			expect(version).not.toBeInTheDocument();
		}
	});
});

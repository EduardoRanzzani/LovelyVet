import AppSidebar from '@/components/sidebar/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { requireAuthContext } from '@/lib/security/auth-context';
import type { ReactNode } from 'react';

const ProtectedLayout = async ({ children }: { children: ReactNode }) => {
	const context = await requireAuthContext();

	return (
		<SidebarProvider>
			<AppSidebar role={context.role} />
			<SidebarInset className='min-w-0'>
				{/* <main className='w-full'></main> */}
				{children}
			</SidebarInset>
		</SidebarProvider>
	);
};

export default ProtectedLayout;

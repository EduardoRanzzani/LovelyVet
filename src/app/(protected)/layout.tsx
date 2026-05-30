import AppSidebar from '@/components/sidebar/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ReactNode } from 'react';

const ProtectedLayout = ({ children }: { children: ReactNode }) => {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset className='min-w-0'>
				{/* <main className='w-full'></main> */}
				{children}
			</SidebarInset>
		</SidebarProvider>
	);
};

export default ProtectedLayout;

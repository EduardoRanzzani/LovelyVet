import { Separator } from '../ui/separator';
import { SidebarTrigger } from '../ui/sidebar';

export const PageContainer = ({ children }: { children: React.ReactNode }) => {
	// Removido o padding daqui para o header ser full-width
	return <div className='flex flex-col'>{children}</div>;
};

export const PageHeader = ({ children }: { children: React.ReactNode }) => {
	return (
		<header className='flex shrink-0 items-center gap-4 border-b p-4 top-0 z-10 rounded-t-lg bg-sidebar-accent'>
			<div className='flex items-center gap-2'>
				<SidebarTrigger variant='ghost' />
				<Separator orientation='vertical' className='h-6' />
			</div>
			<div className='flex flex-1 items-center justify-between'>{children}</div>
		</header>
	);
};

export const PageHeaderContent = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	return <div className='flex flex-col'>{children}</div>; // Removido space-y-1 para alinhar melhor
};

export const PageTitle = ({ children }: { children: React.ReactNode }) => {
	return <h1 className='text-lg font-semibold leading-none'>{children}</h1>;
};

export const PageDescription = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	return <p className='text-muted-foreground text-sm'>{children}</p>;
};

export const PageActions = ({ children }: { children: React.ReactNode }) => {
	return <div className='flex items-center gap-2'>{children}</div>;
};

export const PageContent = ({ children }: { children: React.ReactNode }) => {
	// O padding agora fica aqui no conteúdo
	return <div className='flex-1 p-4 space-y-6'>{children}</div>;
};

import { ClientProviders } from '@/components/shared/client-providers';
import { ptBR } from '@clerk/localizations';
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
	variable: '--font-poppins',
	subsets: ['latin'],
	weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
	title: 'Mv. Regina de Oliveira Maciel',
	description: 'Sistema de gerenciamento de atendimentos em domicílio',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ClerkProvider localization={ptBR} dynamic>
			<html lang='pt-BR' suppressHydrationWarning>
				<body className={`${poppins.className} antialiased md:subpixel-antialiased`}>
					<ClientProviders>{children}</ClientProviders>
				</body>
			</html>
		</ClerkProvider>
	);
}

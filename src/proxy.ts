import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// 1. Definição das Rotas Públicas e Webhooks
const isPublicRoute = createRouteMatcher([
	'/sign-in(.*)',
	'/sign-up(.*)',
	'/teste',
]);
const isWebhookRoute = createRouteMatcher(['/api/webhooks/clerk']);

// 2. Mapeamento de permissões baseado no seu Sidebar
const rolePermissions = {
	admin: [
		'/dashboard',
		'/doctors',
		'/pets',
		'/customers',
		'/breeds',
		'/species',
		'/services',
		'/appointments',
		'/prescriptions-template',
		'/calculators',
		'/shifts',
		'/messages',
		'/admin',
		'/clinics',
		'/recipe-layout',
		'/prescriptions-items',
	],
	doctor: [
		'/dashboard',
		'/pets',
		'/customers',
		'/breeds',
		'/species',
		'/services',
		'/appointments',
		'/prescriptions-template',
		'/calculators',
		'/shifts',
		'/recipe-layout',
		'/prescriptions-items',
	],
	customer: ['/dashboard', '/pets', '/appointments', '/recipe-layout'],
};

export default clerkMiddleware(async (auth, req) => {
	// Ignora verificação para Webhooks
	if (isWebhookRoute(req)) return;

	// Se não for pública, verifica se o usuário está logado
	if (!isPublicRoute(req)) {
		const { userId, sessionClaims } = await auth();

		// Se não estiver logado, auth.protect() redireciona para login automaticamente
		if (!userId) {
			return (await auth()).redirectToSignIn();
		}

		// 3. Pega a role dos metadados (fallback para 'customer')
		const userRole =
			(sessionClaims?.metadata as { role?: string })?.role || 'customer';

		// 4. Lógica de Autorização
		const { nextUrl } = req;
		const pathname = nextUrl.pathname;

		// Verifica se o usuário tem permissão para a rota atual
		const allowedRoutes =
			rolePermissions[userRole as keyof typeof rolePermissions] ||
			rolePermissions.customer;

		// Verifica se a rota atual (ou sub-rotas) está na lista de permitidas
		const isAllowed = allowedRoutes.some((route) => pathname.startsWith(route));

		// Se o usuário está logado e tenta acessar a "/" (que não existe)
		// Redirecionamos direto para o dashboard
		if (userId && nextUrl.pathname === '/') {
			return NextResponse.redirect(new URL('/dashboard', req.url));
		}

		// Se a rota não for pública e o usuário não tiver permissão
		if (!isAllowed && pathname !== '/') {
			// Redireciona para o dashboard se tentar acessar algo proibido
			return NextResponse.redirect(new URL('/dashboard', req.url));
		}
	}
});

export const config = {
	matcher: [
		'/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
		'/(api|trpc)(.*)',
	],
};

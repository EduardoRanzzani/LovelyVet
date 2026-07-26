import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const isWebhookRoute = createRouteMatcher(['/api/webhooks/clerk']);
const isPublicRoute = createRouteMatcher([
	'/sign-in(.*)',
	'/sign-up(.*)',
	'/teste',
]);

const isInternalPrintRequest = (req: NextRequest): boolean => {
	const { searchParams, pathname } = req.nextUrl;

	if (!pathname.startsWith('/prescriptions/print')) {
		return false;
	}

	const secretFromEnv =
		process.env.INTERNAL_PDF_SECRET || 'internal-pdf-secret-to-download';
	const secretFromQuery = searchParams.get('secret');

	return secretFromQuery === secretFromEnv;
};

type Role = 'admin' | 'doctor' | 'customer';

const rolePermissions: Record<Role, string[]> = {
	admin: [
		'/dashboard',
		'/doctors',
		'/pets',
		'/customers',
		'/breeds',
		'/species',
		'/services',
		'/appointments',
		'/prescriptions',
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
		'/prescriptions',
		'/calculators',
		'/shifts',
		'/recipe-layout',
		'/prescriptions-items',
	],
	customer: ['/dashboard', '/pets', '/appointments', '/recipe-layout'],
};

export default clerkMiddleware(async (auth, req) => {
	// 1. Ignora Webhooks e requisições internas de PDF com segredo válido
	if (isWebhookRoute(req) || isInternalPrintRequest(req)) {
		return NextResponse.next();
	}

	// 2. Se for rota pública
	if (isPublicRoute(req)) {
		return NextResponse.next();
	}

	// 3. Autenticação para rotas privadas
	const { userId, sessionClaims } = await auth();

	if (!userId) {
		return (await auth()).redirectToSignIn();
	}

	const userRole =
		(sessionClaims?.metadata as { role?: Role })?.role ?? 'customer';

	const { nextUrl } = req;
	const pathname = nextUrl.pathname;

	const allowedRoutes = rolePermissions[userRole] || rolePermissions.customer;
	const isAllowed = allowedRoutes.some((route) => pathname.startsWith(route));

	if (pathname === '/') {
		return NextResponse.redirect(new URL('/dashboard', req.url));
	}

	if (!isAllowed) {
		return NextResponse.redirect(new URL('/dashboard', req.url));
	}
});

export const config = {
	matcher: [
		'/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
		'/(api|trpc)(.*)',
	],
};

// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
// import { NextRequest, NextResponse } from 'next/server';

// // 1. Definição das Rotas Públicas e Webhooks
// const isPublicRoute = createRouteMatcher([
// 	'/sign-in(.*)',
// 	'/sign-up(.*)',
// 	'/teste',
// ]);
// const isWebhookRoute = createRouteMatcher(['/api/webhooks/clerk']);

// // Função para verificar se é uma requisição interna de impressão válida
// const isInternalPrintRequest = (req: NextRequest): boolean => {
// 	const { searchParams, pathname } = req.nextUrl;
// 	const isPrintRoute = pathname.startsWith('/prescriptions/print');

// 	const secret = process.env.INTERNAL_PDF_SECRET || 'chave_secreta_fallback';
// 	const hasValidSecret = searchParams.get('secret') === secret;

// 	return isPrintRoute && hasValidSecret;
// };

// // 2. Mapeamento de permissões baseado no seu Sidebar
// const rolePermissions = {
// 	admin: [
// 		'/dashboard',
// 		'/doctors',
// 		'/pets',
// 		'/customers',
// 		'/breeds',
// 		'/species',
// 		'/services',
// 		'/appointments',
// 		'/prescriptions',
// 		'/calculators',
// 		'/shifts',
// 		'/messages',
// 		'/admin',
// 		'/clinics',
// 		'/recipe-layout',
// 		'/prescriptions-items',
// 	],
// 	doctor: [
// 		'/dashboard',
// 		'/pets',
// 		'/customers',
// 		'/breeds',
// 		'/species',
// 		'/services',
// 		'/appointments',
// 		'/prescriptions',
// 		'/calculators',
// 		'/shifts',
// 		'/recipe-layout',
// 		'/prescriptions-items',
// 	],
// 	customer: ['/dashboard', '/pets', '/appointments', '/recipe-layout'],
// };

// export default clerkMiddleware(async (auth, req) => {
// 	// 1. Ignora Webhooks e requisições internas autorizadas com segredo
// 	if (isWebhookRoute(req) || isInternalPrintRequest(req)) {
// 		return;
// 	}

// 	// Se não for pública, verifica se o usuário está logado
// 	if (!isPublicRoute(req)) {
// 		const { userId, sessionClaims } = await auth();

// 		// Se não estiver logado, auth.protect() redireciona para login automaticamente
// 		if (!userId) {
// 			return (await auth()).redirectToSignIn();
// 		}

// 		// 3. Pega a role dos metadados (fallback para 'customer')
// 		const userRole =
// 			(sessionClaims?.metadata as { role?: string })?.role || 'customer';

// 		// 4. Lógica de Autorização
// 		const { nextUrl } = req;
// 		const pathname = nextUrl.pathname;

// 		// Verifica se o usuário tem permissão para a rota atual
// 		const allowedRoutes =
// 			rolePermissions[userRole as keyof typeof rolePermissions] ||
// 			rolePermissions.customer;

// 		// Verifica se a rota atual (ou sub-rotas) está na lista de permitidas
// 		const isAllowed = allowedRoutes.some((route) => pathname.startsWith(route));

// 		// Se o usuário está logado e tenta acessar a "/" (que não existe)
// 		// Redirecionamos direto para o dashboard
// 		if (userId && nextUrl.pathname === '/') {
// 			return NextResponse.redirect(new URL('/dashboard', req.url));
// 		}

// 		// Se a rota não for pública e o usuário não tiver permissão
// 		if (!isAllowed && pathname !== '/') {
// 			// Redireciona para o dashboard se tentar acessar algo proibido
// 			return NextResponse.redirect(new URL('/dashboard', req.url));
// 		}
// 	}
// });

// export const config = {
// 	matcher: [
// 		'/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
// 		'/(api|trpc)(.*)',
// 	],
// };

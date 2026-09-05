import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { normalizeUserRole, type UserRole } from './lib/security/roles';

const isWebhookRoute = createRouteMatcher(['/api/webhooks/clerk']);
const isPublicRoute = createRouteMatcher([
	'/sign-in(.*)',
	'/sign-up(.*)',
	'/teste',
]);

const isInternalPrintRequest = (req: NextRequest): boolean => {
	const secretFromEnv = process.env.INTERNAL_PDF_SECRET;

	if (!secretFromEnv) {
		return false;
	}

	const secretFromQuery = req.nextUrl.searchParams.get('secret');
	return secretFromQuery === secretFromEnv;
};

const rolePermissions: Record<UserRole, string[]> = {
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

	const userRole = normalizeUserRole(sessionClaims?.metadata?.role);

	const { nextUrl } = req;
	const pathname = nextUrl.pathname;

	const allowedRoutes = rolePermissions[userRole];
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

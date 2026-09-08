import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { normalizeUserRole, type UserRole } from './lib/security/roles';
import { isPathWithinRoute } from './lib/security/routes';

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
		'/prescriptions-items',
	],

	customer: [
		'/dashboard',
		'/pets',
		'/appointments',

		/*
		 * Customer pode acessar apenas a rota
		 * de impressão da receita.
		 *
		 * O acesso à receita específica ainda
		 * passa por assertCanAccessPet().
		 */
		'/prescriptions/print',
	],
};

export default clerkMiddleware(async (auth, req) => {
	/*
	 * 1. Webhooks e requisições internas
	 * de PDF com segredo válido.
	 */
	if (isWebhookRoute(req) || isInternalPrintRequest(req)) {
		return NextResponse.next();
	}

	/*
	 * 2. Rotas públicas.
	 */
	if (isPublicRoute(req)) {
		return NextResponse.next();
	}

	/*
	 * 3. Demais rotas exigem autenticação.
	 */
	const { userId, sessionClaims } = await auth();

	if (!userId) {
		return (await auth()).redirectToSignIn();
	}

	const userRole = normalizeUserRole(sessionClaims?.metadata?.role);

	const { nextUrl } = req;
	const pathname = nextUrl.pathname;

	if (pathname === '/') {
		return NextResponse.redirect(new URL('/dashboard', req.url));
	}

	const allowedRoutes = rolePermissions[userRole];

	const isAllowed = allowedRoutes.some((route) =>
		isPathWithinRoute(pathname, route),
	);

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

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isWebhookRoute = createRouteMatcher(['/api/webhooks/clerk']);

const isPublicRoute = createRouteMatcher([
	'/sign-in(.*)',
	'/sign-up(.*)',
	'/teste',
]);

export default clerkMiddleware(async (auth, req) => {
	/*
	 * 1. Webhook público do Clerk.
	 */
	if (isWebhookRoute(req)) {
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
	const { userId } = await auth();

	if (!userId) {
		return (await auth()).redirectToSignIn();
	}

	const { nextUrl } = req;
	const pathname = nextUrl.pathname;

	if (pathname === '/') {
		return NextResponse.redirect(new URL('/dashboard', req.url));
	}

	return NextResponse.next();
});

export const config = {
	matcher: [
		'/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
		'/(api|trpc)(.*)',
	],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public routes that don't require auth
    const publicRoutes = ['/login', '/manifest.json', '/favicon.ico', '/sw.js'];

    // Check if the path starts with any of the public routes
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    if (isPublicRoute) {
        return NextResponse.next();
    }

    // NOTE: In a real Next.js middleware, reading Firebase Auth state is tricky because 
    // the SDK is client-side or requires Admin SDK involving cookies. 
    // For this MVP, we will rely on Client-side RouteGuard for strong protection
    // and use Middleware mainly for basic asset protection if tokens were implemented.
    // 
    // HOWEVER, for a simple implementation without session cookies yet:
    // We will let the Client Component (AuthContext/RouteGuard) handle the redirect 
    // if not logged in.

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - icons
         */
        '/((?!api|_next/static|_next/image|icons).*)',
    ],
};

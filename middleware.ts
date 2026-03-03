import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './lib/auth';

// Routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/api/auth/login', '/api/auth/signup', '/api/auth/setup', '/api/auth/session'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes through
    if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
        return NextResponse.next();
    }

    // Get session cookie
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify the JWT — decrypt returns null if expired/invalid
    const session = await decrypt(sessionCookie);

    if (!session?.user) {
        // Clear the invalid/expired cookie and redirect
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('session');
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|public/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};

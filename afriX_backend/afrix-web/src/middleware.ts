import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Allow access to login pages
    if (
        pathname === '/login' ||
        pathname === '/merchant/login' ||
        pathname === '/merchant/register' ||
        pathname === '/verify-email' ||
        pathname.startsWith('/pay/')
    ) {
        return NextResponse.next()
    }

    if (pathname === '/merchant' || pathname.startsWith('/merchant/')) {
        const merchantToken = request.cookies.get('merchant_token')?.value
        if (!merchantToken) {
            return NextResponse.redirect(new URL('/merchant/login', request.url))
        }
        return NextResponse.next()
    }

    const adminToken = request.cookies.get('admin_token')?.value
    if (!adminToken) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

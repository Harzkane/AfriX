import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function base64UrlDecode(str: string): Uint8Array {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Verify JWT signature using native Web Crypto HMAC-SHA256
 */
async function verifyJwtSignature(token: string, secret: string): Promise<boolean> {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        const [headerB64, payloadB64, signatureB64] = parts;

        const encoder = new TextEncoder();
        const data = encoder.encode(`${headerB64}.${payloadB64}`);
        const signature = base64UrlDecode(signatureB64);

        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        return await crypto.subtle.verify(
            'HMAC',
            key,
            signature as unknown as BufferSource,
            data as unknown as BufferSource
        );
    } catch {
        return false;
    }
}

async function isValidJwt(token: string | undefined): Promise<boolean> {
    if (!token) return false;
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    try {
        const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadJson);
        if (payload.exp && payload.exp < Date.now() / 1000) {
            return false; // Expired
        }

        const jwtSecret = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET;
        if (jwtSecret) {
            const isSignatureValid = await verifyJwtSignature(token, jwtSecret);
            if (!isSignatureValid) {
                return false;
            }
        }

        return true;
    } catch {
        return false;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Allow access to public and auth pages
    if (
        pathname === '/' ||
        pathname === '/login' ||
        pathname === '/merchant/login' ||
        pathname === '/merchant/register' ||
        pathname === '/verify-email' ||
        pathname === '/reset-password' ||
        pathname.startsWith('/pay/') ||
        pathname.startsWith('/api/')
    ) {
        return NextResponse.next()
    }

    if (pathname === '/merchant' || pathname.startsWith('/merchant/')) {
        const merchantToken = request.cookies.get('merchant_token')?.value
        if (!merchantToken || !(await isValidJwt(merchantToken))) {
            const response = NextResponse.redirect(new URL('/merchant/login', request.url))
            response.cookies.delete('merchant_token')
            return response
        }
        return NextResponse.next()
    }

    const adminToken = request.cookies.get('admin_token')?.value
    if (!adminToken || !(await isValidJwt(adminToken))) {
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('admin_token')
        return response
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

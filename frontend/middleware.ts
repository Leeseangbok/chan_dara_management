import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  sub: string;
  roles: string; // e.g. "ROLE_STAFF", "ROLE_ADMIN", "ROLE_MANAGER"
  exp: number;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('sbms_access_token')?.value;

  // Protect the dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      
      // Check if token is expired
      if (decoded.exp * 1000 < Date.now()) {
        // We could handle refresh logic here, but for simplicity we redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Check roles
      const role = decoded.roles.replace('ROLE_', '');
      if (role !== 'ADMIN' && role !== 'MANAGER') {
        // If they are just staff, send them to POS instead
        return NextResponse.redirect(new URL('/pos', request.url));
      }
    } catch (err) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Example: If a logged-in user hits /login, redirect them to their respective area
  if (request.nextUrl.pathname === '/login') {
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (decoded.exp * 1000 > Date.now()) {
          const role = decoded.roles.replace('ROLE_', '');
          if (role === 'ADMIN' || role === 'MANAGER') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
          } else {
            return NextResponse.redirect(new URL('/pos', request.url));
          }
        }
      } catch (err) {
        // Invalid token, just let them see the login page
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};

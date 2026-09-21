import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function proxy(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  // Rutas que requieren autenticación
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

  // Rutas de autenticación (para evitar que un usuario logueado vuelva a /login)
  const isAuthRoute = pathname === '/login';

  // 1. Si intenta ir a una ruta protegida sin cookie -> Redirigir a /login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Si ya está logueado e intenta ir a /login -> Redirigir a /dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
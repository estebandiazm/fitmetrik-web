import { updateSession } from '@/infrastructure/adapters/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Refresh the session cookie (single Supabase client per request)
  const { response, user } = await updateSession(request)
  const role = user?.user_metadata?.role

  // Redirects must carry the refreshed auth cookies, or the rotated refresh token is lost
  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url))
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  // RBAC Routing Logic
  const { pathname } = request.nextUrl;
  const isRoot = pathname === '/';
  const isLoginPage = pathname.startsWith('/login');
  const isAuthCallback = pathname.startsWith('/auth/callback');
  const isUpdatePasswordPage = pathname.startsWith('/update-password');

  // Root redirect: always send "/" to the correct destination
  if (isRoot) {
    if (!user) {
      return redirectTo('/login');
    }
    if (role === 'client') return redirectTo('/dashboard');
    if (role === 'coach') return redirectTo('/clients');
    return redirectTo('/login?error=Unknown+role.+Contact+your+administrator.');
  }

  if (!user && !isLoginPage && !isAuthCallback) {
    // Unauthenticated users trying to access protected routes
    return redirectTo('/login')
  }

  if (user && isLoginPage) {
    // Unknown role — let them stay on login with the error
    if (role !== 'coach' && role !== 'client') return response;
    // Authenticated users with a valid role — redirect to their home
    return redirectTo(role === 'coach' ? '/clients' : '/dashboard')
  }

  // If they are on the update-password page, let them stay there
  if (user && isUpdatePasswordPage) {
    return response;
  }

  // Prevent clients from accessing dashboard
  if (user && role === 'client' && request.nextUrl.pathname.startsWith('/clients')) {
    return redirectTo('/dashboard')
  }

  // Prevent coaches from accessing client portal
  if (user && role === 'coach' && request.nextUrl.pathname.startsWith('/dashboard')) {
    return redirectTo('/clients')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes handle their own auth)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

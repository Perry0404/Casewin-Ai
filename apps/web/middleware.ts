import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that don't require authentication — viewable by everyone
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/predictions',
  '/marketplace',
  '/tools',
  '/privacy',
  '/terms',
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow public routes and API routes
  if (isPublicRoute(pathname) || pathname.startsWith('/api/')) {
    return await updateSession(request)
  }

  // For protected routes, check auth and redirect if not logged in
  return await updateSession(request, true)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

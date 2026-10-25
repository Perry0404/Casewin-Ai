import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest, requireAuth: boolean = false) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip Supabase session refresh if not configured — prevents hanging
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    // If auth is required but Supabase isn't configured, redirect to login
    if (requireAuth) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
    return response
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Use getSession() for speed (local JWT check, no server roundtrip)
    // getUser() makes a server call which adds 1-3s latency
    // getSession() refreshes an expired token over the network; if Supabase is
    // slow or paused that call can hang until the middleware times out (504)
    // and take the whole site down. Give up after 1.5s and treat the visitor
    // as signed out instead.
    let user = null
    try {
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500))
      const session = supabase.auth.getSession().then(({ data }) => data?.session?.user ?? null)
      user = await Promise.race([session, timeout])
    } catch {
      // Ignore errors — page will still load
    }

    // If auth is required and user is not logged in, redirect to login
    if (requireAuth && !user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  } catch {
    // Supabase not available
    if (requireAuth) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

import { NextResponse, type NextRequest } from 'next/server'
import { getMember, getUser, isPlatformAdmin } from '@/lib/auth'

// After sign-in: admins to /admin, approved volunteers to their desk, everyone else to finish registering.
export async function GET(req: NextRequest) {
  const to = (p: string) => NextResponse.redirect(new URL(p, req.url))
  const user = await getUser()
  if (!user) return to('/login')
  const next = req.nextUrl.searchParams.get('next')
  if (next && next.startsWith('/') && !next.startsWith('//') && next !== '/login') return to(next)
  if (await isPlatformAdmin(user.id)) return to('/admin')
  const m = await getMember()
  return to(m?.status === 'approved' ? '/desk' : '/volunteer')
}

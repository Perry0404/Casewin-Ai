import { NextResponse, type NextRequest } from 'next/server'
import { getMember, getUser, isPlatformAdmin } from '@/lib/auth'

// After sign-in: approved volunteers to their desk, everyone else to finish registering.
// Platform admins choose, because the same account may also be a volunteer.
export async function GET(req: NextRequest) {
  const to = (p: string) => NextResponse.redirect(new URL(p, req.url))
  const user = await getUser()
  if (!user) return to('/login')
  const next = req.nextUrl.searchParams.get('next')
  if (next && next.startsWith('/') && !next.startsWith('//') && next !== '/login' && !next.startsWith('/go')) return to(next)
  if (await isPlatformAdmin(user.id)) return to('/go/choose')
  const m = await getMember()
  return to(m?.status === 'approved' ? '/desk' : '/volunteer')
}

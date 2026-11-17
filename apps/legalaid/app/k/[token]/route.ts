import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient, createSessionClient } from '@/lib/supabase/server'
import { hashToken } from '@/lib/panel'

export const dynamic = 'force-dynamic'

// A panel member's personal sign-in link, sent to them on WhatsApp. No password: the link
// is the credential. Re-sending a link from the panel page replaces the old one.
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const to = (p: string) => NextResponse.redirect(new URL(p, req.url))
  const next = req.nextUrl.searchParams.get('next')
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/desk'
  if (!params.token || params.token.length < 20) return to('/login?error=link')

  const db = createAdminClient()
  const { data: m } = await db.from('la_members').select('user_id, status').eq('access_token_hash', hashToken(params.token)).maybeSingle()
  if (!m || m.status !== 'approved') return to('/login?error=link')

  const { data: u } = await db.auth.admin.getUserById(m.user_id)
  const email = u.user?.email
  if (!email) return to('/login?error=link')
  // Mint a one-time login token server-side (nothing is emailed) and exchange it for a session cookie.
  const { data: link, error } = await db.auth.admin.generateLink({ type: 'magiclink', email })
  if (error || !link.properties?.hashed_token) return to('/login?error=link')
  const { error: vErr } = await createSessionClient().auth.verifyOtp({ type: 'magiclink', token_hash: link.properties.hashed_token })
  if (vErr) return to('/login?error=link')

  await db.from('la_members').update({ last_link_login_at: new Date().toISOString() }).eq('user_id', m.user_id)
  return to(safeNext)
}

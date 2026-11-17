'use server'

import { redirect } from 'next/navigation'
import { createAdminClient, createSessionClient } from '@/lib/supabase/server'
import { hashToken } from '@/lib/panel'

/**
 * One-time onboarding link. It works only when the person types the email address the
 * account was made for; they then choose a password and the link stops working.
 */
export async function claimAccount(f: FormData) {
  const token = String(f.get('token') ?? '')
  const email = String(f.get('email') ?? '').trim().toLowerCase()
  const password = String(f.get('password') ?? '')
  const again = String(f.get('password2') ?? '')
  const back = (e: string) => redirect(`/k/${encodeURIComponent(token)}?error=${e}`)
  if (token.length < 20) redirect('/login?error=link')

  const db = createAdminClient()
  const { data: m } = await db.from('la_members').select('user_id, status').eq('access_token_hash', hashToken(token)).maybeSingle()
  if (!m || m.status !== 'approved') redirect('/login?error=link')
  const { data: u } = await db.auth.admin.getUserById(m.user_id)
  if (!u.user?.email || u.user.email.toLowerCase() !== email) back('email')
  if (password.length < 10) back('short')
  if (password !== again) back('match')

  const { error } = await db.auth.admin.updateUserById(m.user_id, { password })
  if (error) back('failed')
  // Single use: the link dies once the account is claimed.
  await db.from('la_members').update({ access_token_hash: null, last_link_login_at: new Date().toISOString() }).eq('user_id', m.user_id)
  const { error: sErr } = await createSessionClient().auth.signInWithPassword({ email, password })
  if (sErr) redirect('/login')
  redirect('/desk/panel')
}

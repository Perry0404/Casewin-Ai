'use server'

import { createHash } from 'crypto'
import { redirect } from 'next/navigation'
import { createAdminClient, createSessionClient } from '@/lib/supabase/server'

/** Accept an admin invitation: only for the invited email, only once. */
export async function acceptInvite(f: FormData) {
  const token = String(f.get('token') ?? '')
  const email = String(f.get('email') ?? '').trim().toLowerCase()
  const fullName = String(f.get('full_name') ?? '').trim().slice(0, 120)
  const password = String(f.get('password') ?? '')
  const back = (e: string) => redirect(`/invite/${encodeURIComponent(token)}?error=${e}`)
  const db = createAdminClient()
  const { data: inv } = await db.from('admin_invites').select('id, email, full_name, created_by').eq('token_hash', createHash('sha256').update(token).digest('hex')).is('used_at', null).maybeSingle()
  if (!inv) redirect('/login?error=invite')
  if (inv.email.toLowerCase() !== email) back('email')
  if (password.length < 10) back('short')
  if (password !== String(f.get('password2') ?? '')) back('match')

  const { data: created, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName || inv.full_name } })
  if (error || !created.user) back('exists')
  const userId = created.user!.id
  await db.from('platform_admins').upsert({ user_id: userId, full_name: fullName || inv.full_name, added_by: inv.created_by }, { onConflict: 'user_id' })
  await db.from('admin_invites').update({ used_at: new Date().toISOString(), used_by: userId }).eq('id', inv.id)
  await createSessionClient().auth.signInWithPassword({ email, password })
  redirect('/admin')
}

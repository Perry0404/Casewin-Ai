'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { sweepOverdue } from '@/lib/sweep'

const str = (f: FormData, k: string, n = 500) => String(f.get(k) ?? '').trim().slice(0, n)

export async function reviewMember(f: FormData) {
  await requireAdmin()
  const decision = str(f, 'decision')
  const note = str(f, 'note')
  if (decision !== 'approved' && !note) redirect('/admin?error=note')
  const status = ['approved', 'rejected', 'suspended'].includes(decision) ? decision : 'rejected'
  await createAdminClient()
    .from('la_members')
    .update({ status, reviewer_note: note || null, approved_at: status === 'approved' ? new Date().toISOString() : null })
    .eq('user_id', str(f, 'user_id'))
  revalidatePath('/admin')
}

export async function reviewOrg(f: FormData) {
  await requireAdmin()
  const decision = str(f, 'decision')
  const note = str(f, 'note')
  if (decision !== 'approved' && !note) redirect('/admin?error=note')
  const status = decision === 'approved' ? 'approved' : decision === 'suspended' ? 'suspended' : 'rejected'
  const db = createAdminClient()
  const { data: org } = await db
    .from('la_organisations')
    .update({ status, reviewer_note: note || null, approved_at: status === 'approved' ? new Date().toISOString() : null })
    .eq('id', str(f, 'id'))
    .select('id, created_by')
    .single()
  // The person who registered the organisation is its coordinator.
  if (org?.created_by) await db.from('la_members').update({ status, approved_at: status === 'approved' ? new Date().toISOString() : null }).eq('user_id', org.created_by).eq('role', 'coordinator')
  revalidatePath('/admin')
}

export async function releaseOverdue() {
  await requireAdmin()
  redirect(`/admin?released=${await sweepOverdue()}`)
}

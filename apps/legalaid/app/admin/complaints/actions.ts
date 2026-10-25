'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { getUser, logEvent, requireAdmin } from '@/lib/auth'

const str = (f: FormData, k: string, n = 1000) => String(f.get(k) ?? '').trim().slice(0, n)

export async function resolveComplaint(f: FormData) {
  await requireAdmin()
  const user = await getUser()
  const status = ['investigating', 'resolved', 'dismissed'].includes(str(f, 'status')) ? str(f, 'status') : 'investigating'
  const note = str(f, 'resolution')
  if (status !== 'investigating' && !note) redirect('/admin/complaints?error=note')
  await createAdminClient()
    .from('la_complaints')
    .update({ status, resolution: note || null, resolved_by: status === 'investigating' ? null : user!.id, resolved_at: status === 'investigating' ? null : new Date().toISOString() })
    .eq('id', str(f, 'id'))
  revalidatePath('/admin/complaints')
}

/** Takes the case off the volunteer a family complained about and puts it back on the board. */
export async function removeVolunteer(f: FormData) {
  await requireAdmin()
  const db = createAdminClient()
  const { data: k } = await db.from('la_complaints').select('id, case_id').eq('id', str(f, 'id')).maybeSingle()
  if (!k) redirect('/admin/complaints')
  await db
    .from('la_cases')
    .update({ assigned_to: null, assigned_org: null, assigned_at: null, first_action_due: null, first_action_at: null, supervisor_id: null, status: 'new', updated_at: new Date().toISOString() })
    .eq('id', k.case_id)
  await logEvent({ case_id: k.case_id, kind: 'released', actor_label: 'CaseWin Legal Aid', body: 'Removed from the volunteer by an administrator.' })
  await logEvent({ case_id: k.case_id, kind: 'public_update', actor_label: 'CaseWin Legal Aid', body: 'We are finding another volunteer for this case.', public: true })
  await db.from('la_complaints').update({ status: 'investigating' }).eq('id', k.id).eq('status', 'open')
  revalidatePath('/admin/complaints')
}

/** Deletion request: removes the case, its timeline, documents and stored files. The reference must be typed to confirm. */
export async function deleteCaseData(f: FormData) {
  await requireAdmin()
  const user = await getUser()
  const db = createAdminClient()
  const { data: k } = await db.from('la_complaints').select('id, case_id, la_cases(ref)').eq('id', str(f, 'id')).maybeSingle()
  const ref = (k?.la_cases as unknown as { ref: string } | null)?.ref
  if (!k || !ref) redirect('/admin/complaints')
  if (str(f, 'confirm_ref', 20).toUpperCase() !== ref) redirect('/admin/complaints?error=confirm')
  const { data: docs } = await db.from('la_documents').select('path').eq('case_id', k.case_id)
  if (docs?.length) await db.storage.from('la-documents').remove(docs.map((d) => d.path))
  // The complaint row goes with the case (cascade); keep a minimal, anonymous record that a deletion happened.
  await db.from('la_cases').delete().eq('id', k.case_id)
  await db.from('la_notifications').insert({ case_id: null, channel: 'email', recipient: '-', template: 'data_deleted', status: 'skipped', detail: `Case data deleted on request by admin ${user!.id}` })
  redirect('/admin/complaints?deleted=1')
}
